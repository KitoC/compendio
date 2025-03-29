import { NormalizedEmailResponse } from "./emailAgentMessage";

export enum MessageRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
  FORM = "form",
  FUNCTION = "function",
  QUICK_REPLY = "quick-reply",
  OPTIONS = "options",
  EMAIL_AGENT = "email_agent",
}

export type OpenAiRole =
  | MessageRole.ASSISTANT
  | MessageRole.USER
  | MessageRole.SYSTEM
  | MessageRole.FUNCTION;

export type OpenAiMessage = {
  content: string;
  role: OpenAiRole;
};

export interface NormalChatContent {
  text?: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  id: string;
  user_id?: string;
  conversation_id?: string;
  role: MessageRole | string;
  content: NormalChatContent | NormalizedEmailResponse;
  metadata: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  loading?: boolean;
  reply_to?: string;
  tenant_id: string;
}

export interface FormData {
  [key: string]: string | boolean | number;
}

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  domain?: string;
  session_id?: string;
}
