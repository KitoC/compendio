import React from "react";
import { ChatContext } from "./ChatContext";
import { useChatState } from "./useChatState";

export const ChatProvider: React.FC<{
  children: React.ReactNode;
  conversationId: string;
  initiateConversation?: string;
}> = ({ children, conversationId, initiateConversation }) => {
  const chatState = useChatState({ conversationId, initiateConversation });

  return (
    <ChatContext.Provider value={chatState}>{children}</ChatContext.Provider>
  );
};
