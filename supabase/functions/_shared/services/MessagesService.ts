// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";
import type { ChatMessage } from "../../../../src/types/chat";

class MessagesService extends BaseSupabaseService {
  constructor(public req: Request, public context: BaseRequiredContext) {
    super(context);
    this.tableName = "messages";
  }

  async createMessageForConversations(
    conversation_ids: string[],
    message_data: Omit<ChatMessage, "id">
  ) {
    if (!conversation_ids.length) {
      this.throwError("No conversation ids provided", 400);
    }

    const { data, error } = await this.supabase.rpc(
      "create_message_for_conversations",
      { conversation_ids, message_data }
    );

    if (error) {
      this.throwError("Failed to create message", error, 500);
    }

    return data;
  }
}

export { MessagesService };
