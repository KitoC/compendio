// ============================================
// EmailReceivedHandler.ts
// Handles 'process-email-received' task type
// ============================================

import { PublicContext } from "@/middleware/withPublicContext";

import {
  IAgentFunctionHandler,
  IAgentFunctionHandlerResult,
} from "@/interfaces/IAgentFunctionHandler";
import type { IFunction, IFunctionCall } from "@/types/aiAgents";

export class OnboardingProgressUpdateHandler implements IAgentFunctionHandler {
  constructor(public context: PublicContext) {}

  async handle(
    fnCall: IFunctionCall,
    fn: IFunction
  ): Promise<IAgentFunctionHandlerResult> {
    const { onboarding_session_id, updates, inferredEntities } =
      fnCall.arguments;

    const existingSession =
      await this.context.onboardingSessionsService.getById(
        onboarding_session_id
      );

    if (!existingSession) {
      this.context.onboardingSessionsService.throwError(
        "Onboarding session not found",
        404
      );
    }

    const onBoardingSession =
      await this.context.onboardingSessionsService.update(
        onboarding_session_id,
        {
          state: {
            ...existingSession.state,
            updates,
            inferredEntities,
          },
        }
      );

    return {
      result: null,
      functionMessage: "Onboarding progress updated successfully",
    };
  }
}
