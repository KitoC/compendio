import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, MessageRole } from "@/types/chat";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from "uuid";
import { sendMessageToAI } from "@/services/aiChatService";
import { useAiAgents } from "@/contexts/AiAgents/useAiAgents";
import { useParams } from "react-router-dom";

interface UseChatOptions {
  conversationId: string;
}

export const useChatState = ({ conversationId }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { currentAgent } = useAiAgents();
  const params = useParams();

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user, tenantId } = useAuth();

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
        setMessages(data as ChatMessage[]);

        // Scroll to bottom after messages load
        setTimeout(() => scrollToOptimalPosition({ behavior: "instant" }), 100);
      }
    } catch (error: unknown) {
      console.error("Error loading messages:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load messages"
      );
    }
  }, [conversationId, scrollToOptimalPosition]);

  const handleSendMessage = useCallback(
    async (content: string, role: MessageRole = MessageRole.USER) => {
      if (!content.trim() || !conversationId || !user || !tenantId) return;

      const newMessage: ChatMessage = {
        id: uuidv4(),
        role,
        content: { text: content },
        conversation_id: conversationId,
        metadata: {},
        reply_to: undefined,
        user_id: user.id,
        tenant_id: tenantId,
      };

      // Add the user message to the UI
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(true);
      setTimeout(scrollToOptimalPosition, 100);

      try {
        // Save the user message to the database
        await supabase.from("messages").insert([newMessage]);

        // Create a placeholder message for the AI response
        const aiMessage = {
          id: uuidv4(),
          conversation_id: conversationId,
          role: "assistant",
          content: { text: "" },
          metadata: {},
          user_id: user.id,
          tenant_id: tenantId,
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Send messages to AI and handle streaming response
        await sendMessageToAI({
          messageId: aiMessage.id,
          messagesToSend: [...messages, newMessage],
          conversationId,
          agentId: currentAgent?.id || "",
          userId: user.id,
          tenantId,
          // Update callback - updates the UI as content streams in
          onUpdate: (text) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id ? { ...msg, content: { text } } : msg
              )
            );

            scrollToOptimalPosition();
          },
          onFunctionCall: ({ message }) => {
            if (message) {
              setMessages((prev) => [...prev, message]);
            }
          },
          // Complete callback - updates UI when streaming is done
          onComplete: async (finalMessage) => {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === aiMessage.id ? finalMessage : msg))
            );
          },
        });
      } catch (error: unknown) {
        console.error("Error in handleSendMessage:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to send message"
        );

        // Update the AI message to show the error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.role === MessageRole.ASSISTANT && msg.loading
              ? {
                  ...msg,
                  content: {
                    text: "Sorry, I encountered an error. Please try again.",
                  },
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
    [
      messages,
      conversationId,
      scrollToOptimalPosition,
      user,
      tenantId,
      currentAgent,
    ]
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
          const newMessage = payload.new as ChatMessage;

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
    messagesContainerRef,
    inputRef,
    handleSendMessage,
    conversationId,
  };
};
