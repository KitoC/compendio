// NO_CHANGE

import {
  BaseRequiredContext,
  BaseSupabaseService,
} from "locals/services/_BaseSupabaseService";
import type { ChatMessage } from "../../../../src/types/chat";
import { getEnvKey } from "locals/utils/env";

class MessagesService extends BaseSupabaseService {
  constructor(public context: BaseRequiredContext) {
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

    const encryption_key = getEnvKey("ENCRYPTION_KEY");

    const { data, error } = await this.supabase.rpc(
      "create_message_for_conversations",
      { conversation_ids, message_data, encryption_key }
    );

    if (error) {
      this.throwError("Failed to create message", error, 500);
    }

    return data;
  }

  async getConversationMessages({
    conversation_id,
    search,
    metadata_search,
    role,
    limit = 50,
    offset = 0,
    order = "created_at",
    sort_direction = "asc",
    include_deleted = false,
  }: {
    conversation_id: string;
    search?: string;
    metadata_search?: string;
    role?: string;
    limit?: number;
    offset?: number;
    order?: string;
    sort_direction?: "asc" | "desc";
    include_deleted?: boolean;
  }) {
    const decryption_key = getEnvKey("ENCRYPTION_KEY");

    const { data, error } = await this.supabase.rpc(
      "get_conversation_messages",
      {
        _conversation_id: conversation_id,
        _decryption_key: decryption_key,
        _search: search,
        _metadata_search: metadata_search,
        _role: role,
        _limit: limit,
        _offset: offset,
        _order: order,
        _sort_direction: sort_direction,
        _include_deleted: include_deleted,
      }
    );

    if (error) {
      this.throwError("Failed to retrieve messages", error, 500);
    }

    return data;
  }

  async updateMessage({
    message_id,
    content,
    role,
    metadata,
  }: {
    message_id: string;
    content: Record<string, unknown>;
    role: string;
    metadata: Record<string, unknown>;
  }) {
    const encryption_key = getEnvKey("ENCRYPTION_KEY");

    const { error } = await this.supabase.rpc("update_message", {
      _message_id: message_id,
      _content: content,
      _role: role,
      _metadata: metadata,
      _encryption_key: encryption_key,
    });

    if (error) {
      this.throwError("Failed to update message", error, 500);
    }

    return true;
  }
}

export { MessagesService };
