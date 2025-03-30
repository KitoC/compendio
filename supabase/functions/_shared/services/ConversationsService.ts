// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";

export interface IConversation {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

class ConversationsService extends BaseSupabaseService {
  constructor(public context: BaseRequiredContext) {
    super(context);
    this.tableName = "conversations";
  }

  async getAgentConversations(agentId: string) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        conversation_participants!inner(agent_id)
      `
      )
      .eq("conversation_participants.agent_id", agentId);

    if (error) {
      this.throwError("Error getting agent conversations", error);
    }

    return data;
  }
}

export { ConversationsService };
