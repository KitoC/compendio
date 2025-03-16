import { supabase } from "@/integrations/supabase/client";
import { IMessage } from "@/types/chat";
import { Json } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from "uuid";
import { callSupabaseFunction } from "./supabaseFunctionServices";
import { streamResponse } from "@/utils/streamResponse";

const streamAiResponse = async ({
  endpoint,
  args,
  onUpdate,
  onFunctionCall,
}: {
  endpoint: string;
  args: object;
  onUpdate: (content: object) => void;
  onFunctionCall: (functionCall: object) => void;
}) => {
  const response = await callSupabaseFunction(endpoint, args);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI chat error (${response.status}):`, errorText);
    throw new Error(`AI chat error: ${errorText}`);
  }

  // Initialize content variable to collect streamed response

  let content = "";
  let functionCalled = false;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break; // Exit loop when stream is complete

    buffer += decoder.decode(value, { stream: true });

    // Process JSON messages line-by-line
    const parts = buffer.split("\n");
    buffer = parts.pop(); // Keep incomplete chunk in buffer

    for (const part of parts) {
      if (part.trim()) {
        try {
          const { text, function_call } = JSON.parse(part);

          if (text) {
            content = text;
            onUpdate(text);
          }

          if (function_call && !functionCalled) {
            onFunctionCall(function_call);
            functionCalled = true;
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      }
    }
  }

  return content;
};
/**
 * Sends a message to the AI and streams the response
 */

interface SendMessageToAIProps {
  messageId: string;
  messagesToSend: IMessage[];
  conversationId: string;
  agentId: string;
  userId: string | undefined;
  tenantId: string | undefined;
  onUpdate: (message: IMessage) => void;
  onComplete: (message: IMessage) => Promise<void>;
}
export const sendMessageToAI = async ({
  messageId,
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

    const id = messageId;

    const content = await streamAiResponse({
      endpoint: "ai-chat",
      args: {
        conversation_id: conversationId,
        messages: formattedMessages,
        agent_id: agentId,
      },
      onUpdate,
      onFunctionCall: async (functionCall) => {
        const response = await callSupabaseFunction("wss-functions", {
          conversation_id: conversationId,
          agent_id: agentId,
          messages: formattedMessages,
          function_call: functionCall,
        });

        const data = await response.json();

        console.log("functionCall", data);
      },
    });

    // Once streaming is complete, save the message to the database
    const finalMessage: IMessage = {
      id,
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
  } catch (error: unknown) {
    console.error("Error in sendMessageToAI:", error);
    throw error;
  }
};
