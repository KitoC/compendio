import { SupabaseFunctionService } from "./supabaseFunctionServices";

interface MessageQuery {
  conversation_id: string;
  limit: string;
  offset: string;
  role?: string;
  search?: string;
}
export const MessageService = {
  async getMessages(conversationId: string, query: MessageQuery) {
    const response = await SupabaseFunctionService.get("messages", {
      conversation_id: conversationId,
      ...query,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    return response.json();
  },
};
