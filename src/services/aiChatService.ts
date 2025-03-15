import { supabase } from "@/integrations/supabase/client";
import { IMessage } from "@/types/chat";
import { Json } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from "uuid";
import { callSupabaseFunction } from "./supabaseFunctionServices";
/**
 * Sends a message to the AI and streams the response
 */

interface SendMessageToAIProps {
  messagesToSend: IMessage[];
  conversationId: string;
  agentId: string;
  userId: string | undefined;
  tenantId: string | undefined;
  onUpdate: (content: string) => void;
  onComplete: (message: IMessage) => Promise<void>;
}
export const sendMessageToAI = async ({
  messagesToSend,
  conversationId,
  agentId,
  userId,
  tenantId,
  onUpdate,
  onComplete,
}: SendMessageToAIProps): Promise<IMessage | null> => {
  if (!conversationId || !userId || !tenantId) return null;

  try {
    const formattedMessages = messagesToSend.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content),
    }));

    const response = await callSupabaseFunction("ai-chat", {
      conversation_id: conversationId,
      messages: formattedMessages,
      agent_id: agentId,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI chat error (${response.status}):`, errorText);
      throw new Error(`AI chat error: ${errorText}`);
    }

    // Initialize content variable to collect streamed response
    let content = "";
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("Failed to get response reader");
    }

    // Process the streamed response
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the chunk and add it to our content
      const chunk = new TextDecoder().decode(value);
      content += chunk;

      // Update the UI with the current content
      onUpdate(content);
    }

    // Once streaming is complete, save the message to the database
    const finalMessage: IMessage = {
      id: messagesToSend[messagesToSend.length - 1].id,
      role: "assistant",
      content,
      loading: false,
    };

    // Save the complete message to the database
    await supabase.from("messages").insert({
      id: uuidv4(),
      conversation_id: conversationId,
      role: finalMessage.role,
      content: { text: finalMessage.content } as Json,
      metadata: {} as Json,
      user_id: userId,
      tenant_id: tenantId,
    });

    // Call the onComplete callback
    await onComplete(finalMessage);

    return finalMessage;
  } catch (error: any) {
    console.error("Error in sendMessageToAI:", error);
    throw error;
  }
};
