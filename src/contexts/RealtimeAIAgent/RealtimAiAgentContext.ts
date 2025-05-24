import { createContext, useContext } from "react";

interface RealtimeAiAgentContextType {
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  error: string | null;
  isConnecting: boolean;
  assistantTalking: boolean;
  currentInteraction: CurrentInteraction;
  messages: Message[];
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
    transcript: "",
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
