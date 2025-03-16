
import { createContext } from "react";
import { IMessage } from "@/types/chat";

export interface ChatContextType {
  messages: IMessage[];
  isTyping: boolean;
  wsConnected: boolean;
  userId: string;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  handleSendMessage: (content: string) => Promise<void>;
  conversationId: string;
}

export const ChatContext = createContext<ChatContextType>({
  messages: [],
  isTyping: false,
  wsConnected: false,
  userId: "",
  messagesContainerRef: { current: null },
  inputRef: { current: null },
  handleSendMessage: async () => {},
  conversationId: "",
});
