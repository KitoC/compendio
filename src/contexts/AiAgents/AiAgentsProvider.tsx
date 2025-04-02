import { ReactNode, useEffect } from "react";
import { AiAgentsContext } from "./AiAgentsContext";
import { useAiAgentsQuery } from "@/hooks/useAiAgentsQuery";
import { Params, useLocation, useParams, Location } from "react-router-dom";
import { IAiAgent } from "@/types/aiAgents";
import { isOnBoardingRoute } from "@/utils/pathCheckers";

const SYSTEM_AGENTS: { [key: string]: IAiAgent } = {
  ONBOARDING: {
    id: "onboarding",
    name: "Onboarding",
    type: "system",
    human_name: "Onboarding",
    responsibility: "Onboarding",
  },
};

const getCurrentAgent = (
  aiAgents: IAiAgent[],
  params: Readonly<Params<string>>,
  location: Location
) => {
  const currentAgent = aiAgents.find((agent) => agent.name === params.id);

  if (isOnBoardingRoute(location)) {
    return SYSTEM_AGENTS.ONBOARDING;
  }

  return currentAgent;
};

interface AiAgentsProviderProps {
  children: ReactNode;
}

export const AiAgentsProvider = ({ children }: AiAgentsProviderProps) => {
  const {
    aiAgents,
    isLoading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    setupRealTimeSubscription,
  } = useAiAgentsQuery();
  const params = useParams();
  const location = useLocation();

  // Set up real-time subscription
  useEffect(() => {
    const cleanup = setupRealTimeSubscription();
    return cleanup;
  }, [setupRealTimeSubscription]);

  // Find the current agent based on the URL parameter
  const currentAgent = getCurrentAgent(aiAgents, params, location);

  return (
    <AiAgentsContext.Provider
      value={{
        aiAgents,
        currentAgent,
        isLoading,
        error,
        createAgent: (agent: Partial<IAiAgent>) =>
          createAgent.mutateAsync(agent),
        updateAgent: (agent: IAiAgent) => updateAgent.mutateAsync(agent),
        deleteAgent: (agentId: string) => deleteAgent.mutateAsync(agentId),
      }}
    >
      {children}
    </AiAgentsContext.Provider>
  );
};
