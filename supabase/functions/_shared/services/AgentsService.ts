// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "@/services/_BaseSupabaseService";

class AgentsService extends BaseSupabaseService {
  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "ai_agents";
  }

  async getAgents() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*");

    if (error) {
      this.throwError("Error fetching agents:", error);
    }

    return data;
  }
}

export { AgentsService };
