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
import { useVoiceContext } from "@/contexts/VoiceProvider";
import { getSentenceChunks } from "./getGroupedSentences";
import { useTTS } from "../TTSProvider";
import { useDebouncedCallback } from "use-debounce";
import { FunctionService } from "@/services/functionService";
import { IFunctionCall } from "@/types/aiAgents";
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
  const { playQueue, reset } = useTTS();
  const { hasSpoken, transcript, sendTranscript } = useVoiceContext();

  const sendFinalTranscript = useDebouncedCallback(() => {
    const cleaned = transcript.trim();
    if (hasSpoken && cleaned.length > 0) {
      console.log("🎙️ Sending:", cleaned);
      handleSendMessage(cleaned);
      sendTranscript(); // Reset logic
    }
  }, 1200); // Delay in ms — adjust as needed

  const replaceMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
  }, []);

  useEffect(() => {
    if (!hasSpoken || !transcript.trim()) return;

    sendFinalTranscript(); // ✅ debounce will control timing
  }, [transcript, hasSpoken, sendFinalTranscript]);

  const aiMessageRef = useRef<ChatMessage | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const interruptAiAgent = useCallback(() => {
    sendMessage({
      type: "chat:stop",
      conversation_id: conversationId,
      agent_id: currentAgent?.id,
    });
  }, [sendMessage, conversationId, currentAgent?.id]);

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

  const triggerFunctionCall = useCallback(
    async (payload: IFunctionCall) => {
      try {
        if (payload.manual) {
          console.log("🔹 manual function call", payload);
          const response = await FunctionService.triggerManualFunction(
            currentAgent?.id || "",
            payload
          );

          return { result: response };
        } else {
          sendMessage({
            type: "chat:trigger_function_call",
            conversation_id: conversationId,
            agent_id: currentAgent?.id,
            payload,
          });
        }
      } catch (err) {
        console.error("Error triggering function call", err);
        return { err };
      }
    },
    [sendMessage, conversationId, currentAgent?.id]
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user || !tenantId || !conversationId) return;
      reset();

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
      reset,
    ]
  );

  const handleUpdateMessage = useCallback(async (message: ChatMessage) => {
    try {
      await MessageService.updateMessage(message);

      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
    } catch (err) {
      console.error("Error updating message", err);
      toast.error("Message failed to update");
    }
  }, []);

  useEffect(() => {
    const listener = async (
      data: SocketData<{ text: string; function_call: { name: string } }>
    ) => {
      if (!aiMessageRef.current) return;

      switch (data.type) {
        case "chat:update": {
          const newText = data.value.text;

          replaceMessage({
            ...aiMessageRef.current,
            content: { text: newText },
          });

          // ✂️ Split into sentence chunks
          // TODO: Turn this one via useTTS`
          // const chunks = getSentenceChunks(newText);
          // const completeChunks = chunks.filter((chunk) => chunk.isDone);
          // if (completeChunks.length) {
          //   playQueue(completeChunks);
          // }

          scrollToBottom();
          break;
        }

        case "chat:done":
          setIsTyping(false);
          // stopTTS(); // 🆕 Stop any queued playback
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
    playQueue,
    replaceMessage,
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

        if (loaded.messages) {
          setMessages(loaded.messages.reverse());
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
    interruptAiAgent,
    triggerFunctionCall,
    conversationId,
    replaceMessage,
    handleUpdateMessage,
  };
};
