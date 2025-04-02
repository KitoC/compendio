// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";

class OnboardingSessionsService extends BaseSupabaseService {
  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "onboarding_sessions";
  }
}

export { OnboardingSessionsService };
