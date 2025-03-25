// NO_CHANGE

// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";
import type Logger from "../shared/utils/logger.ts";

class ConversationsController {
  private supabase: SupabaseClient | null;
  private userId: string | null;
  private user: object | null;
  private logger: Logger;

  constructor({ logger }: { logger: Logger }) {
    this.supabase = null;
    this.userId = null;
    this.logger = logger;
  }

  async getConversations(userId: string) {
    const { data, error } = await this.supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId);
  }

  async getConversationById(conversationId: string) {
    return await this.supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();
  }

  async insertConversation(conversationId: string) {
    return this.supabase.from("conversations").insert({
      id: conversationId,
      user_id: this.userId,
      title: "New Conversation",
      domain: "default",
    });
  }

  async insertMessages(messages: object[]) {
    this.logger.debug("MESSAGES TO INSERT", messages);
    try {
      return await this.supabase.from("messages").insert(messages);
    } catch (error) {
      this.logger.error("Error in insertMessages:", error);
      throw error;
    }
  }

  /**
   * Validates the conversation or creates it if it doesn't exist
   */
  async validateOrCreateConversation(conversationId: string) {
    try {
      // Check if the conversation exists
      const { data: conversationData, error: conversationError } =
        await this.getConversationById(conversationId);

      if (conversationError && conversationError.code === "PGRST116") {
        // PGRST116 means no rows returned - conversation doesn't exist
        // Get the user's ID from their JWT
        const { data: userData, error: userError } =
          await this.supabase.auth.getUser();

        if (userError) {
          throw new Error(`Failed to get user: ${userError.message}`);
        }

        const userId = userData.user?.id;

        if (!userId) {
          throw new Error("User not authenticated");
        }

        // Create a new conversation
        const { error: createError } = await this.insertConversation(
          conversationId
        );

        if (createError) {
          throw new Error(
            `Failed to create conversation: ${createError.message}`
          );
        }
      } else if (conversationError) {
        throw new Error(
          `Failed to check conversation: ${conversationError.message}`
        );
      }

      return true;
    } catch (error) {
      console.error("Error in validateOrCreateConversation:", error);
      throw error;
    }
  }

  async setDependencies({ supabase }: { supabase: SupabaseClient }) {
    this.supabase = supabase;
    const user = await this.supabase.auth.getUser();

    this.user = user.data.user;
    this.userId = user.data.user?.id;
  }
}

export default ConversationsController;
