import { createContext, useContext } from "react";
import { RealtimeAiAgentContextType, ROLES } from "./types";

export const RealtimeAiAgentContext = createContext<RealtimeAiAgentContextType>(
  {
    startListening: () => {},
    stopListening: () => {},
    isListening: false,
    isConnected: false,
    error: null,
    isConnecting: false,
    assistantTalking: false,
    currentInteraction: {
      user: { role: ROLES.USER, content: "", done: false },
      assistant: { role: ROLES.ASSISTANT, content: "", done: false },
    },
    messages: [],
    isMuted: false,
    toggleMute: () => {},
    sendMessage: () => {},
    dismissError: () => {},
    realtimeAgent: null,
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
