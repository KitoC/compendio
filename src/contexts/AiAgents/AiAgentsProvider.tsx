
import { ReactNode, useEffect } from "react";
import { AiAgentsContext } from "./AiAgentsContext";
import { useAiAgentsQuery } from "@/hooks/useAiAgentsQuery";
import { useParams } from "react-router-dom";
import { IAiAgent } from "@/types/aiAgents";

interface AiAgentsProviderProps {
  children: ReactNode;
}

export const AiAgentsProvider = ({ children }: AiAgentsProviderProps) => {
  const { aiAgents, isLoading, error, createAgent, updateAgent, deleteAgent, setupRealTimeSubscription } = useAiAgentsQuery();
  const params = useParams();

  // Set up real-time subscription
  useEffect(() => {
    const cleanup = setupRealTimeSubscription();
    return cleanup;
  }, [setupRealTimeSubscription]);

  // Find the current agent based on the URL parameter
  const currentAgent = aiAgents.find((agent) => agent.name === params.id);

  return (
    <AiAgentsContext.Provider
      value={{
        aiAgents,
        currentAgent,
        isLoading,
        error,
        createAgent: (agent: Partial<IAiAgent>) => createAgent.mutateAsync(agent),
        updateAgent: (agent: IAiAgent) => updateAgent.mutateAsync(agent),
        deleteAgent: (agentId: string) => deleteAgent.mutateAsync(agentId),
      }}
    >
      {children}
    </AiAgentsContext.Provider>
  );
};
