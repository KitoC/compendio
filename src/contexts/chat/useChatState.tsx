// We'll refactor this hook to use the new SocketProvider + useSocket
// And cleanly separate out the message handling logic

import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessage, MessageRole } from "@/types/chat";
import { useAuth } from "@/hooks/useAuth";
import { useAiAgents } from "@/contexts/AiAgents/useAiAgents";
import { useTenant } from "@/contexts/TenantContext";
import { useSocket, SocketData } from "@/contexts/SocketProvider";
import useChatHelpers from "./useChatHelpers";
import { MessageService } from "@/services/MessageService";
import { toast } from "sonner";
import { listenForFunctionCalls } from "@/services/aiChatService";
import { User } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";

interface UseChatOptions {
  conversationId: string;
}

export const useChatState = ({ conversationId }: UseChatOptions) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const { user } = useAuth();
  const { currentAgent } = useAiAgents();
  const { tenantId } = useTenant();
  const { sendMessage, addMessageListener, removeMessageListener } =
    useSocket();

  const aiMessageRef = useRef<ChatMessage | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { createAiMessage, createHumanMessage } = useChatHelpers({
    conversationId,
    user: user as User,
    tenantId,
  });

  const scrollToBottom = useCallback((instant = false) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: instant ? "instant" : "smooth",
      });
    }
  }, []);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user || !tenantId || !conversationId) return;

      const humanMessage = createHumanMessage(text);
      const aiMessage = createAiMessage("");

      aiMessageRef.current = aiMessage;

      setMessages((prev) => [...prev, humanMessage, aiMessage]);
      setIsTyping(true);

      try {
        await MessageService.createMessage(humanMessage);
        sendMessage({
          type: "chat:start",
          conversation_id: conversationId,
          agent_id: currentAgent?.id,
          userMessage: humanMessage,
        });

        scrollToBottom();
      } catch (err) {
        console.error("send error", err);
        toast.error("Message failed to send");
      }
    },
    [
      user,
      tenantId,
      conversationId,
      createAiMessage,
      createHumanMessage,
      currentAgent,
      sendMessage,
      scrollToBottom,
    ]
  );

  useEffect(() => {
    const listener = (
      data: SocketData<{ text: string; function_call: { name: string } }>
    ) => {
      if (!aiMessageRef.current) return;

      switch (data.type) {
        case "chat:update":
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageRef.current!.id
                ? { ...msg, content: { text: data.value.text } }
                : msg
            )
          );
          scrollToBottom();
          break;

        case "chat:done":
          setIsTyping(false);
          MessageService.createMessage({
            ...aiMessageRef.current,
            content: { text: data.value.text },
          });
          break;

        case "function_call":
          listenForFunctionCalls({
            conversationId,
            agentId: currentAgent?.id || "",
            userId: user.id,
            tenantId,
            messageId: aiMessageRef.current?.id || "",
            functionCall: data.value.function_call,
            onFunctionCall: ({ message }) => {
              if (message) {
                setMessages((prev) => [...prev, message]);
              }
            },
          });
          break;
      }
    };

    addMessageListener(listener);
    return () => removeMessageListener(listener);
  }, [
    addMessageListener,
    removeMessageListener,
    scrollToBottom,
    currentAgent,
    user,
    tenantId,
    conversationId,
  ]);

  // 🔁 Load initial messages on mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const query = {
          conversation_id: conversationId,
          limit: "20",
          offset: "0",
          order: "created_at",
          sort_direction: "desc",
        };

        const loaded = await MessageService.getMessages(conversationId, query);

        if (loaded) {
          setMessages(loaded.reverse());
          setTimeout(() => scrollToBottom(true), 100);
          setMessagesLoaded(true);
        }
      } catch (err) {
        console.error("Error loading messages:", err);
        toast.error("Failed to load messages");
      }
    };

    if (conversationId) loadMessages();
  }, [conversationId, scrollToBottom]);

  // 🔁 Subscribe to new messages in this conversation (optional if you're also streaming via WS)
  useEffect(() => {
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
            if (!prev.some((m) => m.id === newMessage.id)) {
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
  }, [conversationId]);

  return {
    messages,
    isTyping,
    userId: user?.id || "",
    inputRef,
    messagesContainerRef,
    handleSendMessage,
    messagesLoaded,
  };
};
