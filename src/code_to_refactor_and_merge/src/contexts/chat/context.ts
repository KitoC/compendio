import { createContext, useContext } from "react";
import { IMessage } from "../ai/types";

export interface ChatContextType {
  messages: IMessage[];
  isTyping: boolean;
  userId: string;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  handleSendMessage: (message: string) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useAI must be used within an AIProvider");
  }

  return context;
};
