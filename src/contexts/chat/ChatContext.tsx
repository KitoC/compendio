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
  triggerFunctionCall: (
    payload: object
  ) => Promise<{ err: Error | null; result: unknown | null }>;
  replaceMessage: (message: ChatMessage) => void;
  messagesLoaded: boolean;
  interruptAiAgent: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);
