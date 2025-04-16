// providers/AgentProviderRegistry.ts

import { IAgentProvider } from "@/interfaces/IAgentProvider";
import { OpenAiAgent } from "@/providers/agents/OpenAiAgent";
import type { IAiAgent } from "@/types/aiAgents";
import { FunctionController } from "@/controllers/FunctionController";

type Factory = (agent: IAiAgent) => IAgentProvider;

export function getAgentProvider(
  provider: string,
  functionController: FunctionController
): Factory {
  const providerMap: Record<string, Factory> = {
    openai: (agent: IAiAgent) => new OpenAiAgent(agent, functionController),
    // gmail: new GmailWebhookProvider(),
  };

  const found = providerMap[provider];

  if (!found) {
    throw new Error(`Agent provider not supported: ${provider}`);
  }
  return found;
}
