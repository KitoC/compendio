import React from "react";
import { AiAgentsContext } from "./AiAgentsContext";
import { useAiAgentsState } from "./useAiAgentsState";

export const AiAgentsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const aiAgentsState = useAiAgentsState();

  return (
    <AiAgentsContext.Provider value={aiAgentsState}>
      {children}
    </AiAgentsContext.Provider>
  );
};
