import type { IAiAgent } from "@/types/aiAgents";
import { AgentController } from "locals/controllers/AgentController";
import { FunctionController } from "locals/controllers/FunctionController";
import { OnboardingAgentController } from "locals/controllers/OnboardingAgentController";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";
import { PublicContext } from "locals/middleware/withPublicContext";
import { getAgentProvider } from "locals/providers/agents/AgentProviderRegistry";

const SYSTEM_AGENTS: { [key: string]: IAiAgent } = {
  ONBOARDING: {
    id: "onboarding",
    name: "Onboarding",
    type: "system",
    human_name: "Onboarding",
    responsibility: "Onboarding",
    provider: "openai",
    model: "gpt-4o-mini",
  },
};

const getAgentController = async (
  context: PublicContext | AuthenticatedContext,
  functionController: FunctionController,
  agentId: string,
  sessionContext: Record<string, unknown>
) => {
  if (agentId === "onboarding") {
    const agent = SYSTEM_AGENTS.ONBOARDING;

    const adapterFactory = getAgentProvider(agent.provider, functionController);
    const agentAdapter = adapterFactory(agent);

    return new OnboardingAgentController(
      context,
      functionController,
      agent,
      agentAdapter,
      sessionContext
    );
  }

  return await AgentController.create({
    context,
    functionController,
    agentId,
    sessionContext,
  });
};

export { getAgentController };
