
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { IMessage, MessageRole, ChatMessage } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";

// Get the Supabase URL from environment variables or fallback to the URL from window.__ENV__
const getSupabaseUrl = () => {
  if (import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_SUPABASE_URL) {
    return window.__ENV__.VITE_SUPABASE_URL;
  }
  
  // As a last resort, try to extract it from the Supabase client instance
  const supabaseInstance = supabase as any;
  if (supabaseInstance && supabaseInstance.supabaseUrl) {
    return supabaseInstance.supabaseUrl;
  }
  
  console.error("Could not find Supabase URL in environment variables or window.__ENV__");
  return "https://zgtukvtbfucrvdpicvxx.supabase.co"; // Fallback to hardcoded URL as last resort
};

export interface ChatContextType {
  messages: IMessage[];
  isTyping: boolean;
  userId: string;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  handleSendMessage: (message: string) => void;
  conversationId: string;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

interface UseChatOptions {
  conversationId: string;
}

export const useChatState = ({ conversationId }: UseChatOptions) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { user, tenantId } = useAuth();
  
  const dbMessageToIMessage = useCallback((dbMessage: any): IMessage => {
    return {
      id: dbMessage.id,
      role: dbMessage.role,
      content: typeof dbMessage.content === 'object' && dbMessage.content.text 
        ? dbMessage.content.text 
        : dbMessage.content,
      createdAt: dbMessage.created_at,
      loading: dbMessage.loading || false
    };
  }, []);

  const iMessageToDbMessage = useCallback((message: IMessage, convId: string) => {
    if (!tenantId) {
      throw new Error("No tenant ID available. Please ensure you are authenticated.");
    }
    
    const content: Json = typeof message.content === 'string' 
      ? { text: message.content } 
      : message.content as Json;
      
    return {
      id: message.id,
      conversation_id: convId,
      role: message.role,
      content,
      metadata: {} as Json,
      user_id: user?.id,
      tenant_id: tenantId
    };
  }, [user, tenantId]);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      console.log("Loading messages for conversation ID:", conversationId);
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        console.log(`Found ${data.length} messages for conversation ${conversationId}`);
        const parsedMessages = data.map(msg => dbMessageToIMessage(msg));
        setMessages(parsedMessages);
        
        // Scroll to bottom after messages load
        setTimeout(scrollToOptimalPosition, 100);
      }
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    }
  }, [conversationId, dbMessageToIMessage, toast]);

  const scrollToOptimalPosition = useCallback(
    ({ behavior = "smooth" }: { behavior?: ScrollBehavior } = {}) => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        container.scrollTo({
          top: container.scrollHeight,
          behavior,
        });
      }
    },
    []
  );

  const sendMessageToAI = useCallback(async (messagesToSend: IMessage[]) => {
    if (!conversationId || !user || !tenantId) return null;
    
    setIsStreaming(true);
    const newMessage: IMessage = {
      id: uuidv4(),
      role: MessageRole.ASSISTANT,
      content: "",
      loading: true,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    
    try {
      const formattedMessages = messagesToSend.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }));
      
      // Get the Supabase URL using our helper function
      const supabaseUrl = getSupabaseUrl();
      console.log("Using Supabase URL:", supabaseUrl);
      
      // Ensure the URL doesn't have a trailing slash
      const baseUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
      const functionUrl = `${baseUrl}/functions/v1/ai-chat`;
      
      console.log("Calling AI chat function at:", functionUrl);
      
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          messages: formattedMessages
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI chat error (${response.status}):`, errorText);
        throw new Error(`AI chat error: ${errorText}`);
      }
      
      let content = "";
      
      while (true) {
        const { done, value } = await response.body?.getReader().read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        content += chunk;
        
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, content } : msg
          )
        );
      }
      
      const finalMessage = {
        id: newMessage.id,
        role: MessageRole.ASSISTANT,
        content,
        loading: false,
      };
      
      await supabase
        .from("messages")
        .insert({
          id: finalMessage.id,
          conversation_id: conversationId,
          role: finalMessage.role,
          content: { text: finalMessage.content } as Json,
          metadata: {} as Json,
          user_id: user.id,
          tenant_id: tenantId
        });
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? finalMessage : msg
        )
      );
      
      return finalMessage;
    } catch (error: any) {
      console.error("Error in sendMessageToAI:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id
            ? { ...msg, content: "Sorry, I encountered an error. Please try again.", loading: false }
            : msg
        )
      );
      
      return null;
    } finally {
      setIsStreaming(false);
      setTimeout(scrollToOptimalPosition, 100);
    }
  }, [conversationId, toast, user, tenantId, scrollToOptimalPosition]);

  const handleSendMessage = useCallback(
    async (content: string, role: MessageRole = MessageRole.USER) => {
      if (!content.trim() || !conversationId || !user || !tenantId) return;
      
      const newMessage: IMessage = {
        id: uuidv4(),
        role,
        content,
      };
      
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(true);
      setTimeout(scrollToOptimalPosition, 100);
      
      try {
        await supabase
          .from("messages")
          .insert({
            id: newMessage.id,
            conversation_id: conversationId,
            role: newMessage.role,
            content: { text: newMessage.content } as Json,
            metadata: {} as Json,
            user_id: user.id,
            tenant_id: tenantId
          });
        
        await sendMessageToAI([...messages, newMessage]);
      } catch (error: any) {
        console.error(error);
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive",
        });
      } finally {
        setIsTyping(false);
      }
    },
    [messages, conversationId, sendMessageToAI, scrollToOptimalPosition, toast, user, tenantId]
  );

  useEffect(() => {
    if (!conversationId) return;
    
    loadMessages();
    
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = dbMessageToIMessage(payload.new);
          setMessages((prev) => {
            if (!prev.some(msg => msg.id === newMessage.id)) {
              return [...prev, newMessage];
            }
            return prev;
          });
        }
      )
      .subscribe();
    
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, dbMessageToIMessage, loadMessages]);

  const userId = user?.id || "";

  return {
    messages,
    isTyping,
    userId,
    messagesContainerRef,
    inputRef,
    handleSendMessage,
    conversationId
  };
};

export const ChatProvider: React.FC<{
  children: React.ReactNode;
  conversationId: string;
}> = ({ children, conversationId }) => {
  const chatState = useChatState({ conversationId });
  
  return (
    <ChatContext.Provider value={chatState}>
      {children}
    </ChatContext.Provider>
  );
};
