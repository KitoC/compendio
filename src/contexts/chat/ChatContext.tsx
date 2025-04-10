import { createContext, Dispatch, SetStateAction } from "react";
import { ChatMessage } from "@/types/chat";
import { VirtuosoHandle } from "react-virtuoso";
import { IFunctionCall } from "@/types/aiAgents";
import { UseMutationResult } from "@tanstack/react-query";

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
  functionCallMutation: UseMutationResult<
    { err: Error | null; result: unknown | null },
    Error,
    IFunctionCall
  >;
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
