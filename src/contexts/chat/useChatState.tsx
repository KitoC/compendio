import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IMessage, MessageRole } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import { sendMessageToAI } from "@/services/aiChatService";
import { dbMessageToIMessage, createAIMessage } from "@/utils/chatMessageUtils";
import { Json } from "@/integrations/supabase/types";
import { useAiAgents } from "@/contexts/AiAgents/useAiAgents";
import { useParams } from "react-router-dom";
import { usePrevious } from "react-use";
import { WebSocketMessage } from "@/services/websocketService";
import { useWebSocket } from "@/contexts/websocket";

interface UseChatOptions {
  conversationId: string;
}

export const useChatState = ({ conversationId }: UseChatOptions) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { aiAgents } = useAiAgents();
  const params = useParams();
  const { isConnected, addMessageHandler } = useWebSocket();

  const currentAgent = aiAgents.find((agent) => agent.name === params.id);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { user, tenantId } = useAuth();
  const previousMessages = usePrevious(messages);

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
        const parsedMessages = data.map((msg) => dbMessageToIMessage(msg));
        setMessages(parsedMessages);

        // Scroll to bottom after messages load
        setTimeout(() => scrollToOptimalPosition({ behavior: "instant" }), 100);
      }
    } catch (error: any) {
      console.error("Error loading messages:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive"
      });
    }
  }, [conversationId, toast, scrollToOptimalPosition]);

  // Send a notification through the WebSocket context
  const sendNotification = useCallback((title: string, message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const { sendNotification } = useWebSocket();
    sendNotification(title, message, level);
  }, [useWebSocket]);

  // Handle WebSocket messages
  useEffect(() => {
    const handleWebSocketMessage = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'agent.typing':
          setIsTyping(message.status);
          break;
        
        case 'agent.response':
          // This would be handled by the regular message stream, 
          // but we could use it for immediate visual feedback
          console.log('Agent response via WebSocket:', message);
          break;
        
        case 'conversation.update':
          if (message.conversation_id === conversationId) {
            console.log('Conversation updated, refreshing messages');
            loadMessages();
          }
          break;
        
        default:
          // Other message types are handled by the WebSocketProvider
          break;
      }
    };
    
    // Register handler and get cleanup function
    const removeHandler = addMessageHandler(handleWebSocketMessage);
    
    // Clean up when component unmounts
    return () => removeHandler();
  }, [conversationId, loadMessages, addMessageHandler]);

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

      // Notify WebSocket that we're sending a message
      if (isConnected) {
        const { sendMessage } = useWebSocket();
        sendMessage({
          type: 'chat.message',
          conversationId,
          agentId: currentAgent?.id || "",
          message: content,
          userId: user.id
        });
      }

      try {
        // Save the user message to the database
        await supabase.from("messages").insert({
          id: newMessage.id,
          conversation_id: conversationId,
          role: newMessage.role,
          content: { text: newMessage.content } as Json,
          metadata: {} as Json,
          user_id: user.id,
          tenant_id: tenantId,
        });

        // Create a placeholder message for the AI response
        const aiMessage = createAIMessage();
        setMessages((prev) => [...prev, aiMessage]);

        // Send messages to AI and handle streaming response
        await sendMessageToAI({
          messagesToSend: [...messages, newMessage],
          conversationId,
          agentId: currentAgent?.id || "",
          userId: user.id,
          tenantId,
          // Update callback - updates the UI as content streams in
          onUpdate: (streamedContent) => {
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
          onComplete: async (finalMessage) => {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === aiMessage.id ? finalMessage : msg))
            );
          },
        });
      } catch (error: any) {
        console.error("Error in handleSendMessage:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive"
        });

        // Update the AI message to show the error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.role === MessageRole.ASSISTANT && msg.loading
              ? {
                  ...msg,
                  content: "Sorry, I encountered an error. Please try again.",
                  loading: false,
                }
              : msg
          )
        );
      } finally {
        setIsTyping(false);
        setTimeout(scrollToOptimalPosition, 100);
      }
    },
    [messages, conversationId, scrollToOptimalPosition, toast, user, tenantId, currentAgent, isConnected, useWebSocket]
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
            if (!prev.some((msg) => msg.id === newMessage.id)) {
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
    wsConnected: isConnected,
    messagesContainerRef,
    inputRef,
    handleSendMessage,
    conversationId,
    sendNotification,
  };
};
