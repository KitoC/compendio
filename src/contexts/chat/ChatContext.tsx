import { createContext, Dispatch, SetStateAction } from "react";
import { ChatMessage } from "@/types/chat";
import { VirtuosoHandle } from "react-virtuoso";
import { IFunctionCall } from "@/types/aiAgents";

export interface MessageFilter {
  "metadata.priority": number[];
}

export interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  userId: string;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  handleSendMessage: (message: string) => void;
  conversationId: string;
  triggerFunctionCall: (
    payload: IFunctionCall
  ) => Promise<{ err: Error | null; result: unknown | null }>;
  replaceMessage: (message: ChatMessage) => void;
  interruptAiAgent: () => void;
  handleUpdateMessage: (message: ChatMessage) => void;
  loadMessages: () => void;
  hasMore: boolean;
  isFetchingMore: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  virtuosoProps: {
    firstItemIndex: number;
    virtuosoRef: React.RefObject<VirtuosoHandle>;
  };
  filter: MessageFilter;
  setFilter: Dispatch<SetStateAction<MessageFilter>>;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);
