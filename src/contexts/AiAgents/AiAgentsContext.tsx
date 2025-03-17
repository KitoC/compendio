import { createContext } from "react";
import { IAiAgent } from "@/types/aiAgents";

export interface AiAgentsContextType {
  aiAgents: IAiAgent[];
  currentAgent: IAiAgent | null;
}

export const AiAgentsContext = createContext<AiAgentsContextType | undefined>(
  undefined
);
