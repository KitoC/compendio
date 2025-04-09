// Updated useChatState hook with IntersectionObserver, throttling, and restored full functionality

import { useState, useRef, useCallback, useEffect } from "react";
import { ChatMessage } from "@/types/chat";
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
import { useTTS } from "../TTSProvider";
import { useDebouncedCallback } from "use-debounce";
import { FunctionService } from "@/services/functionService";
import type { IFunctionCall } from "@/types/aiAgents";
import { VirtuosoHandle } from "react-virtuoso";
import { IAiAgent } from "@/types/aiAgents";
interface UseChatOptions {
  conversationId: string;
  initiateConversation?: string;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage, scrollToBottom?: boolean) => void;
  updateMessage: (message: ChatMessage) => void;
  isLoading: boolean;
  virtuosoRef: React.RefObject<VirtuosoHandle>;
  currentAgent: IAiAgent;
}

export const useChatState = ({
  conversationId,
  initiateConversation,
  messages,
  addMessage,
  updateMessage,
  isLoading,
  virtuosoRef,
  currentAgent,
}: UseChatOptions) => {
  const aiMessageRef = useRef<ChatMessage | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  const { user } = useAuth();
  const { tenantId } = useTenant();
  const {
    sendMessage,
    addMessageListener,
    removeMessageListener,
    isOpen: socketIsOpen,
  } = useSocket();
  const { playQueue, reset } = useTTS();
  const { hasSpoken, transcript, sendTranscript } = useVoiceContext();

  const sendFinalTranscript = useDebouncedCallback(() => {
    const cleaned = transcript.trim();
    if (hasSpoken && cleaned.length > 0) {
      handleSendMessage(cleaned);
      sendTranscript();
    }
  }, 1200);

  useEffect(() => {
    if (!hasSpoken || !transcript.trim()) return;
    sendFinalTranscript();
  }, [transcript, hasSpoken, sendFinalTranscript]);

  const { createAiMessage, createHumanMessage } = useChatHelpers({
    conversationId,
    user: user as User,
    tenantId,
  });

  useEffect(() => {
    const listener = async (
      data: SocketData<{ text: string; function_call: { name: string } }>
    ) => {
      if (!aiMessageRef.current) return;

      switch (data.type) {
        case "chat:update": {
          const newText = data.value.text;

          const updatedMessage = {
            ...aiMessageRef.current,
            content: { text: newText },
          };

          updateMessage(updatedMessage);

          break;
        }

        case "chat:done": {
          setIsTyping(false);
          MessageService.createMessage({
            ...aiMessageRef.current,
            content: { text: data.value.text },
          });
          break;
        }

        case "function_call": {
          listenForFunctionCalls({
            conversationId,
            agentId: currentAgent?.id || "",
            userId: user.id,
            tenantId,
            messageId: aiMessageRef.current?.id || "",
            functionCall: data.value.function_call,
            onFunctionCall: ({ message }) => {
              if (message) {
                addMessage(message);
              }
            },
          });
          break;
        }
      }
    };

    addMessageListener(listener);
    return () => removeMessageListener(listener);
  }, [
    addMessageListener,
    removeMessageListener,
    currentAgent,
    user,
    tenantId,
    conversationId,
    setIsTyping,
    addMessage,
    updateMessage,
  ]);

  useEffect(() => {
    if (!socketIsOpen) return;
    if (isLoading) return;

    if (initiateConversation && !messages.length) {
      const conversationInitializer = async () => {
        const aiMessage = createAiMessage("");
        aiMessageRef.current = aiMessage;

        addMessage(aiMessage);
        setIsTyping(true);

        sendMessage({
          type: "chat:start",
          conversation_id: conversationId,
          agent_id: currentAgent?.id,
          userMessage: initiateConversation,
        });
      };

      setTimeout(() => {
        conversationInitializer();
      }, 500);
    }
  }, [
    initiateConversation,
    conversationId,
    currentAgent?.id,
    sendMessage,
    socketIsOpen,
    createAiMessage,
    messages,
    isLoading,
    addMessage,
    setIsTyping,
  ]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user || !tenantId || !conversationId) return;
      reset();

      const humanMessage = createHumanMessage(text);
      const aiMessage = createAiMessage("");

      aiMessageRef.current = aiMessage;

      addMessage(humanMessage);
      addMessage(aiMessage, true);
      setIsTyping(true);

      try {
        await MessageService.createMessage(humanMessage);
        sendMessage({
          type: "chat:start",
          conversation_id: conversationId,
          agent_id: currentAgent?.id,
          userMessage: humanMessage,
        });
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
      reset,
      addMessage,
      setIsTyping,
    ]
  );

  const handleUpdateMessage = useCallback(async (message: ChatMessage) => {
    try {
      await MessageService.updateMessage(message);
      updateMessage(message);
    } catch (err) {
      console.error("Error updating message", err);
      toast.error("Message failed to update");
    }
  }, []);

  const replaceMessage = useCallback(
    (message: ChatMessage) => {
      updateMessage(message);
    },
    [updateMessage]
  );

  const interruptAiAgent = useCallback(() => {
    sendMessage({
      type: "chat:stop",
      conversation_id: conversationId,
      agent_id: currentAgent?.id,
    });
  }, [sendMessage, conversationId, currentAgent?.id]);

  const triggerFunctionCall = useCallback(
    async (payload: IFunctionCall) => {
      try {
        if (payload.manual) {
          const response = await FunctionService.triggerManualFunction(
            currentAgent?.id || "",
            payload
          );
          return { result: response, err: null };
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
        return { err, result: null };
      }
    },
    [sendMessage, conversationId, currentAgent?.id]
  );

  return {
    isTyping,
    userId: user?.id || "",
    inputRef,
    handleSendMessage,
    interruptAiAgent,
    triggerFunctionCall,
    conversationId,
    replaceMessage,
    handleUpdateMessage,
  };
};
