
import { createContext } from "react";
import { Message } from "@/types/message";

interface ChatContextProps {
  messages: Message[];
  isLoading: boolean;
  isProcessing: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  addMessage: (content: string) => Promise<void>;
  processMessageWithAI: (messageContent: string) => Promise<void>;
}

export const ChatContext = createContext<ChatContextProps>({
  messages: [],
  isLoading: false,
  isProcessing: false,
  messagesContainerRef: { current: null },
  addMessage: async () => {},
  processMessageWithAI: async () => {},
});
