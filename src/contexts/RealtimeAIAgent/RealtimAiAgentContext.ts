import { createContext, useContext } from "react";
import { ToolHandler, ToolsAndHandlers } from "./types";
import {
  ConversationItem,
  CreateResponseArgs,
} from "./hooks/useGlobalToolHandler";

interface RealtimeAiAgentContextType {
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  error: string | null;
  isConnecting: boolean;
  assistantTalking: boolean;
  currentInteraction: CurrentInteraction;
  messages: Message[];
  setToolsAndHandlers: React.Dispatch<React.SetStateAction<ToolsAndHandlers>>;
  addToolCallHandlers: (
    handlers: Record<string, ToolHandler>,
    context: { dc: RTCDataChannel }
  ) => void;
  createConversationItem: (item: ConversationItem) => void;
  createResponse: (response: CreateResponseArgs) => void;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface CurrentInteraction {
  user: Message & { done: boolean };
  assistant: Message & { done: boolean };
}

export const RealtimeAiAgentContext = createContext<RealtimeAiAgentContextType>(
  {
    startListening: () => {},
    stopListening: () => {},
    isListening: false,
    error: null,
    isConnecting: false,
    assistantTalking: false,
    currentInteraction: {
      user: { role: "user", content: "", done: false },
      assistant: { role: "assistant", content: "", done: false },
    },
    messages: [],
    setToolsAndHandlers: () => {},
    addToolCallHandlers: () => {},
    createConversationItem: () => {},
    createResponse: () => {},
  }
);

export const useRealtimeAiAgent = () => {
  const context = useContext(RealtimeAiAgentContext);
  if (!context) {
    throw new Error(
      "useRealtimeAiAgent must be used within a RealtimeAiAgentProvider"
    );
  }
  return context;
};
