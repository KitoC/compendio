// @ts-ignore
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

class ConversationsController {
  private supabase: SupabaseClient | null;
  private userId: string | null;
  private user: any | null;

  constructor() {
    this.supabase = null;
    this.userId = null;
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
