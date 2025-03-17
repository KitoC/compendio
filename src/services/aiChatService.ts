
import { supabase } from "@/integrations/supabase/client";

export const aiChatService = async ({
  conversationId,
  message,
  userId,
  tenantId,
}: {
  conversationId: string;
  message: string;
  userId: string;
  tenantId: string;
}) => {
  try {
    // This is a simplified implementation - in reality, you might call a Supabase Function
    // or another API endpoint to process the message with AI
    
    // Call the AI chat service on the backend
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: {
        conversationId,
        message,
        userId,
        tenantId,
      },
    });

    if (error) {
      throw new Error(error.message || "Error processing message with AI");
    }

    return data?.response || "I'm sorry, I couldn't process your message.";
  } catch (error: any) {
    console.error("Error in AI chat service:", error);
    throw new Error(error.message || "Failed to process message");
  }
};
