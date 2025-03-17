
import React from "react";
import { ChatContext } from "./ChatContext";
import { useChatState } from "./useChatState";

export const ChatProvider: React.FC<{
  children: React.ReactNode;
  conversationId: string;
}> = ({ children, conversationId }) => {
  const chatState = useChatState(conversationId);
  
  return (
    <ChatContext.Provider value={chatState}>
      {children}
    </ChatContext.Provider>
  );
};
