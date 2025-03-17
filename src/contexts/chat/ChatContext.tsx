
import { createContext } from "react";
import { IMessage } from "@/types/chat";

export interface ChatContextType {
  messages: IMessage[];
  isTyping: boolean;
  userId: string;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  handleSendMessage: (message: string) => void;
  conversationId: string;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);
