// NO_CHANGE

import { ONBOARDING_AGENT_PROMPT } from "@/SYSTEM_PROMPTS/ONBOARDING/ONBOARDING_AGENT_PROMPT";
import { AgentController } from "locals/controllers/AgentController";
import type { IFunction } from "@/types/aiAgents";
import { ONBOARDING_STEPS } from "@/SYSTEM_CONFIGURATIONS/ONBOARDING_STEPS";
import { AuthenticatedContext } from "locals/middleware/withAuthenticatedContext";

class OnboardingAgentController<
  SessionContext extends Record<string, unknown>
> extends AgentController<SessionContext> {
  async getFunctions(): Promise<IFunction[]> {
    return [];
  }

  async getOrCreateOnboardingSession() {
    const { authService, tenant_id } = this.context as AuthenticatedContext;

    const user_id = authService.user?.id;

    if (!tenant_id) {
      return this.throwError("Tenant ID is required", 400);
    }

    if (!user_id) {
      return this.throwError("User ID is required", 400);
    }

    let onboardingSession;

    const onboardingSessions = await this.context.onboardingSessionsService.get(
      {
        filter: {
          user_id,
          tenant_id,
        },
      }
    );

    onboardingSession = onboardingSessions?.[0];

    if (!onboardingSession) {
      onboardingSession = await this.context.onboardingSessionsService.create({
        user_id,
        tenant_id,
        current_step_id: ONBOARDING_STEPS[0].id,
        state: {},
      });
    }

    return onboardingSession;
  }

  async getRequestArgs(conversationId: string) {
    const { prompt, model = "gpt-4o-mini" } = await this.agent;

    const onBoardingSession = await this.getOrCreateOnboardingSession();

    if (!onBoardingSession) {
      this.throwError("Onboarding session not found", 404);
    }

    const currentStep = ONBOARDING_STEPS.find(
      (step) => step.id === onBoardingSession.current_step_id
    );
    const currentStepIndex = ONBOARDING_STEPS.findIndex(
      (step) => step.id === onBoardingSession.current_step_id
    );

    const nextStep = ONBOARDING_STEPS[currentStepIndex + 1];

    const functions = await this.getFunctions();

    const LAST_N = 20; // TODO: make this dynamic

    const messages = [
      { role: "system", content: ONBOARDING_AGENT_PROMPT },
      {
        role: "system",
        content: { step: currentStep, state: onBoardingSession.state },
      },
      ...(await this.getLastNMessages(conversationId, LAST_N)),
    ];

    await this.context.onboardingSessionsService.update(onBoardingSession.id, {
      ...onBoardingSession,
      current_step_id: nextStep.id,
    });

    return {
      messages,
      model,
      functions,
    };
  }
}

export { OnboardingAgentController };
