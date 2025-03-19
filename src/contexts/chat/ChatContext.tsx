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
  handleHumanVoiceMessage: (message: string) => void;
  handleAgentVoiceMessage: (message: string, functionCall?: object) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);
