import { SupabaseFunctionService } from "./supabaseFunctionServices";
import { ChatMessage } from "@/types/chat";

interface MessageQuery {
  conversation_id: string;
  limit: string;
  offset: string;
  order?: string;
  sort_direction?: string;
  role?: string;
  search?: string;
  filter?: string;
}

export const MessageService = {
  async getMessageById(messageId: string) {
    const response = await SupabaseFunctionService.get("messages", {
      id: messageId,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    return response.json();
  },
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
  async updateMessage(message: ChatMessage) {
    const response = await SupabaseFunctionService.patch("messages", message);

    if (!response.ok) {
      throw new Error("Failed to update message");
    }

    return response.json();
  },
  async createMessage(message: ChatMessage) {
    const response = await SupabaseFunctionService.post("messages", message);

    if (!response.ok) {
      throw new Error("Failed to create message");
    }

    return response.json();
  },
};
