// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";

class AgentFunctionsService extends BaseSupabaseService {
  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "agent_functions";
  }

  async getAgentFunctions(agentId: string) {
    const { data, error } = await this.supabase
      .from("agent_functions")
      .select("function_id")
      .eq("agent_id", agentId);

    if (error) {
      this.throwError("Error fetching agent functions:", error);
    }
    return data;
  }
}

export { AgentFunctionsService };
