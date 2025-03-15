
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IMessage, MessageRole } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import { sendMessageToAI } from "@/services/aiChatService";
import { dbMessageToIMessage, createAIMessage } from "@/utils/chatMessageUtils";
import { Json } from "@/integrations/supabase/types";

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
      toast.error(error.message || "Failed to load messages");
    }
  }, [conversationId, toast]);

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

  const handleSendMessage = useCallback(
    async (content: string, role: MessageRole = MessageRole.USER) => {
      if (!content.trim() || !conversationId || !user || !tenantId) return;
      
      const newMessage: IMessage = {
        id: uuidv4(),
        role,
        content,
      };
      
      // Add the user message to the UI
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(true);
      setTimeout(scrollToOptimalPosition, 100);
      
      try {
        // Save the user message to the database
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
        
        // Create a placeholder message for the AI response
        const aiMessage = createAIMessage();
        setMessages((prev) => [...prev, aiMessage]);
        setIsStreaming(true);
        
        // Send messages to AI and handle streaming response
        await sendMessageToAI(
          [...messages, newMessage],
          conversationId,
          user.id,
          tenantId,
          // Update callback - updates the UI as content streams in
          (streamedContent) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id 
                  ? { ...msg, content: streamedContent, loading: true } 
                  : msg
              )
            );
            scrollToOptimalPosition();
          },
          // Complete callback - updates UI when streaming is done
          async (finalMessage) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id ? finalMessage : msg
              )
            );
          }
        );
      } catch (error: any) {
        console.error("Error in handleSendMessage:", error);
        toast.error(error.message || "Failed to send message");
        
        // Update the AI message to show the error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.role === MessageRole.ASSISTANT && msg.loading
              ? { ...msg, content: "Sorry, I encountered an error. Please try again.", loading: false }
              : msg
          )
        );
      } finally {
        setIsTyping(false);
        setIsStreaming(false);
        setTimeout(scrollToOptimalPosition, 100);
      }
    },
    [messages, conversationId, scrollToOptimalPosition, toast, user, tenantId]
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
  }, [conversationId, loadMessages]);

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
