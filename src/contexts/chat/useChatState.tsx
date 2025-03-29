// NO_CHANGE
import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, MessageRole } from "@/types/chat";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAiAgents } from "@/contexts/AiAgents/useAiAgents";
import { Database } from "@/integrations/supabase/types";
import useChatHelpers from "./useChatHelpers";
import { User } from "@/types/user";
import { aiChatService } from "@/services/aiChatService";
import { useTenant } from "@/contexts/TenantContext";
import { MessageService } from "@/services/MessageService";

interface UseChatOptions {
  conversationId: string;
}

export const useChatState = ({ conversationId }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { currentAgent } = useAiAgents();
  const { user } = useAuth();
  const { tenantId } = useTenant();

  const { createAiMessage, createHumanMessage } = useChatHelpers({
    conversationId,
    user: user as User,
    tenantId,
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      // TODO: Add proper infinite scroll
      const query = {
        conversation_id: conversationId,
        limit: "20",
        offset: "0",
        // role: "user",
        // search: "hello",
      };

      const loadedMessages = await MessageService.getMessages(
        conversationId,
        query
      );

      if (loadedMessages) {
        setMessages(loadedMessages as ChatMessage[]);

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

      const newMessage: ChatMessage = createHumanMessage(content);

      // Add the user message to the UI
      setMessages((prev) => [...prev, newMessage]);
      setIsTyping(true);
      setTimeout(scrollToOptimalPosition, 100);

      try {
        console.log("useChatState.tsx - newMessage", newMessage);
        // Save the user message to the database
        await MessageService.createMessage(newMessage);

        // Create a placeholder message for the AI response
        const aiMessage = createAiMessage("");

        setMessages((prev) => [...prev, aiMessage]);

        // Send messages to AI and handle streaming response
        await aiChatService.sendMessageToAI({
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
      createAiMessage,
      createHumanMessage,
    ]
  );

  const handleHumanVoiceMessage = useCallback(
    async (voiceMessage: string) => {
      if (!voiceMessage.trim() || !conversationId || !user || !tenantId) return;

      const newMessage = createHumanMessage(voiceMessage);

      setMessages((prev) => [...prev, newMessage]);

      try {
        await supabase.from("messages").insert([newMessage]);
      } catch (error: unknown) {
        console.error("Error in handleHumanVoiceMessage:", error);
      } finally {
        setTimeout(scrollToOptimalPosition, 100);
      }
    },
    [
      conversationId,
      user,
      tenantId,
      createHumanMessage,
      setMessages,
      scrollToOptimalPosition,
    ]
  );

  const handleAgentVoiceMessage = useCallback(
    async (voiceMessage: string, functionCall?: object) => {
      if (!voiceMessage.trim() || !conversationId || !user || !tenantId) return;

      const newMessage = createAiMessage(voiceMessage);

      setMessages((prev) => [...prev, newMessage]);

      try {
        await aiChatService.saveVoiceMessageResponse({
          messageId: newMessage.id,
          message: newMessage,
          conversationId,
          agentId: currentAgent?.id || "",
          userId: user.id,
          functionCall,
          tenantId,
          onFunctionCall: ({ message }) => {
            if (message) {
              setMessages((prev) => [...prev, message]);
            }
          },
        });
      } catch (error: unknown) {
        console.error("Error in handleHumanVoiceMessage:", error);
      } finally {
        setTimeout(scrollToOptimalPosition, 100);
      }
    },
    [
      conversationId,
      user,
      tenantId,
      createAiMessage,
      setMessages,
      scrollToOptimalPosition,
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

  console.log("messages", messages);
  return {
    messages,
    isTyping,
    userId,
    messagesContainerRef,
    inputRef,
    handleSendMessage,
    conversationId,
    handleHumanVoiceMessage,
    handleAgentVoiceMessage,
  };
};
