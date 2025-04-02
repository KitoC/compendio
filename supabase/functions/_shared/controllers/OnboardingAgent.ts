// NO_CHANGE

import { IConversation } from "locals/services/ConversationsService";
import { NORMALIZE_EMAIL_PAYLOAD_PROMPT } from "@/SYSTEM_PROMPTS/EMAIL/NORMALIZE_EMAIL_PAYLOAD_PROMPT";
import { ONBOARDING_AGENT_PROMPT } from "@/SYSTEM_PROMPTS/ONBOARDING/ONBOARDING_AGENT_PROMPT";
import { AgentController } from "locals/controllers/AgentController";
import type { IFunction } from "@/types/aiAgents";

class OnboardingAgentController<
  SessionContext extends Record<string, unknown>
> extends AgentController<SessionContext> {
  async getFunctions(): Promise<IFunction[]> {
    return [];
  }

  async getRequestArgs(conversationId: string) {
    const { prompt, model = "gpt-4o-mini" } = await this.agent;

    const functions = await this.getFunctions();

    const LAST_N = 20; // TODO: make this dynamic

    const messages = [
      { role: "system", content: ONBOARDING_AGENT_PROMPT },
      ...(await this.getLastNMessages(conversationId, LAST_N)),
    ];

    return {
      messages,
      model,
      functions,
    };
  }
}

export { OnboardingAgentController };
