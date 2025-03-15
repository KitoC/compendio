import { createContext } from "react";
import { IAiAgent } from "@/types/aiAgents";

export interface AiAgentsContextType {
  aiAgents: IAiAgent[];
}

export const AiAgentsContext = createContext<AiAgentsContextType | undefined>(
  undefined
);
