import { createContext, useContext } from "react";
import { IAiAgent } from "@/types/aiAgents";

interface AiAgentsContextType {
  aiAgents: IAiAgent[];
  currentAgent: IAiAgent | undefined;
  isLoading: boolean;
  error: Error | null;
  createAgent: (agent: Partial<IAiAgent>) => Promise<IAiAgent>;
  updateAgent: (agent: IAiAgent) => Promise<IAiAgent>;
  deleteAgent: (agentId: string) => Promise<void>;
}

export const AiAgentsContext = createContext<AiAgentsContextType>({
  aiAgents: [],
  currentAgent: undefined,
  isLoading: false,
  error: null,
  createAgent: async () => Promise.resolve({} as IAiAgent),
  updateAgent: async () => Promise.resolve({} as IAiAgent),
  deleteAgent: async () => Promise.resolve(),
});

export const useAiAgents = () => {
  const context = useContext(AiAgentsContext);
  if (!context) {
    throw new Error("useAiAgents must be used within a AiAgentsProvider");
  }
  return context;
};
