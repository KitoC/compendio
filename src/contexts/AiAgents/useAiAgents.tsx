import { useContext } from "react";
import { AiAgentsContext } from "./AiAgentsContext";

export const useAiAgents = () => {
  const context = useContext(AiAgentsContext);
  if (!context) {
    throw new Error("useAiAgents must be used within a AiAgentsProvider");
  }
  return context;
};
