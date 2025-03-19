// NO_CHANGE

import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";
import { Database, Json } from "@/integrations/supabase/types";
import { v4 as uuidv4 } from "uuid";
import { callSupabaseFunction } from "./supabaseFunctionServices";

interface ListenForFunctionCallsProps {
  conversationId: string;
  agentId: string;
  userId: string;
  tenantId: string;
  messageId: string;
  functionCall: object;
  onFunctionCall: (functionCall: object) => void;
}

const listenForFunctionCalls = async ({
  conversationId,
  agentId,
  userId,
  tenantId,
  messageId,
  functionCall,
  onFunctionCall,
}: ListenForFunctionCallsProps) => {
  const response = await callSupabaseFunction("wss-functions", {
    conversation_id: conversationId,
    agent_id: agentId,
    function_call: functionCall,
  });

  const data = await response.json();

  const functionCallMessage = {
    id: uuidv4(),
    conversation_id: conversationId,
    role: data.type,
    content: data.markup,
    metadata: {
      config: data.config,
      schema: data.schema,
      function_call: functionCall,
      function_id: data.id,
      function_name: data.name,
      function_description: data.description,
      function_parameters: data.parameters,
      function_type: data.type,
      agent_id: agentId,
    },
    user_id: userId,
    tenant_id: tenantId,
    reply_to: messageId,
  };

  onFunctionCall({
    response: data,
    message: functionCallMessage,
  });

  await supabase
    .from("messages")
    .insert([
      functionCallMessage as Database["public"]["Tables"]["messages"]["Insert"],
    ]);
};

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
    const formattedMessages = messagesToSend.map((msg) => ({
      role: msg.role,
      content: msg.content,
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
      onFunctionCall: (functionCall) =>
        listenForFunctionCalls({
          conversationId,
          agentId,
          userId,
          tenantId,
          messageId,
          functionCall,
          onFunctionCall,
        }),
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
    await supabase
      .from("messages")
      .insert([
        finalMessage as Database["public"]["Tables"]["messages"]["Insert"],
      ]);

    // Call the onComplete callback
    await onComplete(finalMessage);

    return finalMessage;
  } catch (error: unknown) {
    console.error("Error in sendMessageToAI:", error);
    throw error;
  }
};

interface SaveVoiceMessageResponseProps {
  messageId: string;
  message: ChatMessage;
  conversationId: string;
  agentId: string;
  userId: string | undefined;
  tenantId: string | undefined;
  onFunctionCall: (functionCall: {
    response: object;
    message: ChatMessage;
  }) => void;
  functionCall: object;
}

export const saveVoiceMessageResponse = async ({
  messageId,
  message,
  conversationId,
  agentId,
  userId,
  tenantId,
  onFunctionCall,
  functionCall,
}: SaveVoiceMessageResponseProps): Promise<ChatMessage | null> => {
  if (!conversationId || !userId || !tenantId) return null;

  try {
    listenForFunctionCalls({
      conversationId,
      agentId,
      userId,
      tenantId,
      messageId,
      functionCall,
      onFunctionCall,
    });

    // Save the complete message to the database
    await supabase.from("messages").insert([message]);
  } catch (error: unknown) {
    console.error("Error in sendMessageToAI:", error);
    // TODO: Handle errored messages
    throw error;
  }
};

export const aiChatService = {
  sendMessageToAI,
  saveVoiceMessageResponse,
};
