import React, { useMemo } from "react";
import { ChatContext } from "./ChatContext";
import { useChatState } from "./useChatState";
import { useInfiniteMessages } from "./useInfiniteMessages";
import { useVirtuoso } from "./useVirtuoso";

export const ChatProvider: React.FC<{
  children: React.ReactNode;
  conversationId: string;
  initiateConversation?: string;
}> = ({ children, conversationId, initiateConversation }) => {
  const infiniteMessages = useInfiniteMessages(conversationId);
  const virtuosoProps = useVirtuoso(infiniteMessages);
  const chatState = useChatState({
    conversationId,
    initiateConversation,
    ...infiniteMessages,
    ...virtuosoProps,
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
