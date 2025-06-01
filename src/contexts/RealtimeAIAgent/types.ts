import { RealtimeAgent } from "./RealtimeAgent/RealtimeAgent";

type RTCDataChannel = unknown;

// Global tool types
export interface GlobalTool extends Tool {
  handler?: (params: unknown) => void;
}

export interface NavigateToParams {
  url: string;
  dynamicUrl?: string;
}

export interface GlobalSearchParams {
  search: string;
  type?: string;
}

export const ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export type EventType = string; // This should be more specific based on actual event types

export interface Message {
  role: Role;
  content: string;
  done?: boolean;
}

export interface Tool {
  type: string;
  name: string;
  description: string;
  strict?: boolean;
  parameters?: Record<string, unknown>;
}

export interface ToolContext {
  dc: RTCDataChannel;
  toolCall: Record<string, unknown>;
  createConversationItem: (item: ConversationItem) => void;
}

export type ToolHandler = (
  params: unknown,
  context: ToolContext
) => void | Promise<void>;

export interface ToolsAndHandlers {
  tools: Record<string, Tool>;
  handlers: Record<string, ToolHandler>;
}

export interface ConversationItem {
  role: Role;
  content: string;
  done?: boolean;
}

export interface Interaction {
  user: ConversationItem;
  assistant: ConversationItem;
}

export interface UseMessagingAndTranscriptionsProps {
  realtimeAgent: unknown; // We'll properly type this later
}

export interface UseMessagingAndTranscriptionsReturn {
  messages: Message[];
  currentInteraction: Interaction;
  assistantTalking: boolean;
  sendMessage: (message: string) => void;
  resetMessageState: () => void;
}

export interface UseGlobalToolsProps {
  realtimeAgent: unknown; // We'll properly type this later
}

export type Callback = () => void;
export type FunctionCallHandler = (params: unknown) => void;
export type CleanupFunction = () => void;

export type ErrorMessageProps = {
  event_id: string;
  error: {
    code: string;
    message: string;
    param: string;
  };
};

export interface RealtimeAiAgentContextType {
  realtimeAgent: RealtimeAgent;
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  isConnected: boolean;
  error: ErrorMessageProps | null;
  isConnecting: boolean;
  assistantTalking: boolean;
  currentInteraction: Interaction;
  messages: ConversationItem[];
  isMuted: boolean;
  toggleMute: () => void;
  sendMessage: (message: string) => void;
  dismissError: () => void;
}
