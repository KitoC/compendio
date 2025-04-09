import React, { useMemo } from "react";
import { ChatContext } from "./ChatContext";
import { useChatState } from "./useChatState";
import { useInfiniteMessages } from "./useInfiniteMessages";
import { useVirtuoso } from "./useVirtuoso";
import { useAiAgents } from "../AiAgents/useAiAgents";
import { IAiAgent } from "@/types/aiAgents";

export const ChatProvider: React.FC<{
  children: React.ReactNode;
  conversationId: string;
  initiateConversation?: string;
  agentOverride?: IAiAgent;
}> = ({ children, conversationId, initiateConversation, agentOverride }) => {
  const { currentAgent } = useAiAgents();

  const infiniteMessages = useInfiniteMessages(conversationId);
  const virtuosoProps = useVirtuoso(infiniteMessages);
  const chatState = useChatState({
    conversationId,
    initiateConversation,
    ...infiniteMessages,
    ...virtuosoProps,
    currentAgent: agentOverride || currentAgent,
  });

  const value = useMemo(
    () => ({
      ...chatState,
      ...infiniteMessages,
      virtuosoProps,
    }),
    [chatState, infiniteMessages, virtuosoProps]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
