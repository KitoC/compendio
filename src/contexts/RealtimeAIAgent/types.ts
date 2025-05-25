import { TSchema } from "@sinclair/typebox";
import {
  ConversationItem,
  CreateResponseArgs,
} from "./hooks/useGlobalToolHandler";

export type Tool = {
  type: string;
  name: string;
  description: string;
  strict?: boolean;
  parameters?: TSchema;
};

export type ToolContext = {
  dc: RTCDataChannel;
  toolCall: Record<string, unknown>;
  createConversationItem: (item: ConversationItem) => void;
  createResponse: (response: CreateResponseArgs) => void;
};

export type ToolHandler = (
  args: unknown,
  context: ToolContext
) => void | Promise<void>;
export type ToolsAndHandlers = {
  tools: Record<string, Tool>;
  handlers: Record<string, ToolHandler>;
};
