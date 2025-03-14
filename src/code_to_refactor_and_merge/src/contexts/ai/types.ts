import { FormConfig } from "../../components/form-builder/types";

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  FORM = "form",
  SYSTEM = "system",
}

export interface IMessage {
  id: string;
  role: MessageRole;
  content?: FormConfig | string;
  loading?: boolean;
  // tool_calls?: ToolCall[]; // TODO: Add tool calls
  created_at: string;
  updated_at: string;
}
