
import { IMessage, MessageRole, ChatMessage } from "@/types/chat";
import { v4 as uuidv4 } from "uuid";
import { Json } from "@/integrations/supabase/types";

/**
 * Converts a database message to the internal IMessage format
 */
export const dbMessageToIMessage = (dbMessage: any): IMessage => {
  return {
    id: dbMessage.id,
    role: dbMessage.role,
    content: typeof dbMessage.content === 'object' && dbMessage.content.text 
      ? dbMessage.content.text 
      : dbMessage.content,
    createdAt: dbMessage.created_at,
    loading: dbMessage.loading || false
  };
};

/**
 * Converts an IMessage to the database message format
 */
export const iMessageToDbMessage = (message: IMessage, conversationId: string, userId?: string, tenantId?: string) => {
  if (!tenantId) {
    throw new Error("No tenant ID available. Please ensure you are authenticated.");
  }
  
  const content: Json = typeof message.content === 'string' 
    ? { text: message.content } 
    : message.content as Json;
    
  return {
    id: message.id,
    conversation_id: conversationId,
    role: message.role,
    content,
    metadata: {} as Json,
    user_id: userId,
    tenant_id: tenantId
  };
};

/**
 * Creates a new message with a UUID
 */
export const createMessage = (
  content: string,
  role: MessageRole = MessageRole.USER,
  loading: boolean = false
): IMessage => {
  return {
    id: uuidv4(),
    role,
    content,
    loading,
  };
};

/**
 * Creates a new AI message with a UUID
 */
export const createAIMessage = (content: string = ""): IMessage => {
  return createMessage(content, MessageRole.ASSISTANT, true);
};
