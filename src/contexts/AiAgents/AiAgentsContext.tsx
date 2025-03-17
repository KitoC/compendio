
import { createContext } from "react";
import { IAiAgent } from "@/types/aiAgents";

export interface AiAgentsContextType {
  aiAgents: IAiAgent[];
  isLoading: boolean;
  fetchAiAgents: () => Promise<void>;
  createAiAgent: (agent: Omit<IAiAgent, "id" | "created_at" | "updated_at">) => Promise<IAiAgent | null>;
  updateAiAgent: (id: string, updates: Partial<Omit<IAiAgent, "id" | "created_at" | "updated_at">>) => Promise<IAiAgent | null>;
  deleteAiAgent: (id: string) => Promise<boolean>;
}

export const AiAgentsContext = createContext<AiAgentsContextType | undefined>(
  undefined
);
