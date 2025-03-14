
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { IMessage, MessageRole, ChatMessage } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const TENANT_ID = "35eb8c76-7ed5-4109-a520-99c7402d1f03";

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
  const { user } = useAuth();
  
  // Convert database message to IMessage format
  const dbMessageToIMessage = useCallback((dbMessage: ChatMessage): IMessage => {
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

  // Convert IMessage to database message format
  const iMessageToDbMessage = useCallback((message: IMessage, convId: string): Partial<ChatMessage> => {
    return {
      id: message.id,
      conversation_id: convId,
      role: message.role,
      content: typeof message.content === 'string' 
        ? { text: message.content } 
        : message.content,
      metadata: {},
      user_id: user?.id,
      tenant_id: TENANT_ID
    };
  }, [user]);

  // Load messages from the database
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        setMessages(data.map(dbMessageToIMessage));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    }
  }, [conversationId, dbMessageToIMessage, toast]);

  // Scroll to optimal position
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

  // Send message to AI
  const sendMessageToAI = useCallback(async (messagesToSend: IMessage[]) => {
    if (!conversationId || !user) return null;
    
    setIsStreaming(true);
    const newMessage: IMessage = {
      id: uuidv4(),
      role: MessageRole.ASSISTANT,
      content: "",
      loading: true,
    };
    
    setMessages((prev) => [...prev, newMessage]);
    
    try {
      // Format messages for OpenAI
      const formattedMessages = messagesToSend.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }));
      
      // Call the edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            messages: formattedMessages
          }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI chat error: ${errorText}`);
      }
      
      const reader = response.body?.getReader();
      let content = "";
      
      // Handle streaming response
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        content += chunk;
        
        // Update the message with new content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, content } : msg
          )
        );
      }
      
      // Save the final assistant message to the database
      const finalMessage = {
        id: newMessage.id,
        role: MessageRole.ASSISTANT,
        content,
        loading: false,
      };
      
      await supabase
        .from("messages")
        .insert(iMessageToDbMessage(finalMessage, conversationId));
      
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
      
      // Update the message to show error
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
    }
  }, [conversationId, iMessageToDbMessage, toast, user]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (content: string, role: MessageRole = MessageRole.USER) => {
      if (!content.trim() || !conversationId || !user) return;
      
      const newMessage: IMessage = {
        id: uuidv4(),
        role,
        content,
      };
      
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(true);
      setTimeout(scrollToOptimalPosition, 100);
      
      try {
        // Save the user message to the database
        await supabase
          .from("messages")
          .insert(iMessageToDbMessage(newMessage, conversationId));
        
        // Send the message to the AI
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
    [messages, conversationId, iMessageToDbMessage, sendMessageToAI, scrollToOptimalPosition, toast, user]
  );

  // Load messages on initial render and subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;
    
    loadMessages();
    
    // Subscribe to new messages
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
          const newMessage = dbMessageToIMessage(payload.new as ChatMessage);
          // Only add if it's not already in the messages array
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
      supabase.removeChannel(channel);
    };
  }, [conversationId, dbMessageToIMessage, loadMessages]);

  // Auto focus on input and scroll to bottom when messages change
  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
      setTimeout(scrollToOptimalPosition, 100);
    }
  }, [isTyping, messages, scrollToOptimalPosition]);

  // Return the userId from the auth context
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
