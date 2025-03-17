
import { createContext } from "react";
import { Message } from "@/types/message";

interface ChatContextProps {
  messages: Message[];
  isLoading: boolean;
  isProcessing: boolean;
  isTyping?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  addMessage: (content: string) => Promise<void>;
  processMessageWithAI: (messageContent: string) => Promise<void>;
  handleSendMessage?: (message: string) => void;
}

export const ChatContext = createContext<ChatContextProps>({
  messages: [],
  isLoading: false,
  isProcessing: false,
  isTyping: false,
  messagesContainerRef: { current: null },
  addMessage: async () => {},
  processMessageWithAI: async () => {},
  handleSendMessage: () => {},
});
