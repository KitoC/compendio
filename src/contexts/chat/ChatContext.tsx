import { createContext } from "react";
import { ChatMessage } from "@/types/chat";

export interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  userId: string;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  handleSendMessage: (message: string) => void;
  conversationId: string;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);
