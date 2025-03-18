
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";
import { Json } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from "uuid";
import { callSupabaseFunction } from "./supabaseFunctionServices";
import { IFunction } from "@/types/aiAgents";
import { MessageRole } from "@/types/chat";

const streamAiResponse = async ({
  endpoint,
  args,
  onUpdate,
  onFunctionCall,
}: {
  endpoint: string;
  args: object;
  onUpdate: (content: string) => void;
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
  messagesToSend: ChatMessage[];
  conversationId: string;
  agentId: string;
  userId: string | undefined;
  tenantId: string | undefined;
  onUpdate: (message: string) => void;
  onComplete: (message: ChatMessage) => Promise<void>;
  onFunctionCall: (functionCall: {
    response: object;
    message: ChatMessage;
  }) => void;
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
  onFunctionCall,
}: SendMessageToAIProps): Promise<ChatMessage | null> => {
  if (!conversationId || !userId || !tenantId) return null;

  try {
    // Format messages for the API
    const formattedMessages = messagesToSend.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === "string"
          ? msg.content
          : msg.content.text || JSON.stringify(msg.content),
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

        const functionCallMessage: ChatMessage = {
          id: uuidv4(),
          conversation_id: conversationId,
          role: MessageRole.FORM,
          content: { config: data.markup.config },
          metadata: {},
          user_id: userId,
          tenant_id: tenantId,
          reply_to: messageId,
        };

        onFunctionCall({
          response: data,
          message: functionCallMessage,
        });

        await supabase.from("messages").insert([
          {
            id: functionCallMessage.id,
            conversation_id: functionCallMessage.conversation_id,
            role: functionCallMessage.role,
            content: data.markup.config as Json,
            metadata: {} as Json,
            user_id: functionCallMessage.user_id,
            tenant_id: functionCallMessage.tenant_id,
            reply_to: functionCallMessage.reply_to
          }
        ]);
      },
    });

    // Once streaming is complete, save the message to the database
    const finalMessage: ChatMessage = {
      id,
      role: "assistant",
      conversation_id: conversationId,
      content: { text: content },
      metadata: {},
      user_id: userId,
      tenant_id: tenantId,
    };

    // Save the complete message to the database
    await supabase.from("messages").insert([{
      id: finalMessage.id,
      role: finalMessage.role,
      conversation_id: finalMessage.conversation_id,
      content: { text: content } as Json,
      metadata: {} as Json,
      user_id: finalMessage.user_id,
      tenant_id: finalMessage.tenant_id
    }]);

    // Call the onComplete callback
    await onComplete(finalMessage);

    return finalMessage;
  } catch (error: unknown) {
    console.error("Error in sendMessageToAI:", error);
    throw error;
  }
};
