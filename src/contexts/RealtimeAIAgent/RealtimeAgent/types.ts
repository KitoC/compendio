import { EventEmitter } from 'events';
import { Tool } from '../types';

export const EVENTS = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  ERROR: 'ERROR',
  MESSAGE: 'MESSAGE',
  AGENT_IS_TALKING: 'AGENT_IS_TALKING',
  AGENT_RESPONSE_DELTA: 'AGENT_RESPONSE_DELTA',
  AGENT_RESPONSE_DONE: 'AGENT_RESPONSE_DONE',
  USER_TRANSCRIPTION_DELTA: 'USER_TRANSCRIPTION_DELTA',
  USER_TRANSCRIPTION_DONE: 'USER_TRANSCRIPTION_DONE',
  CONVERSATION_ITEM_CREATED: 'CONVERSATION_ITEM_CREATED',
  CONTEXT_UPDATED: 'CONTEXT_UPDATED',
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];

export type EventHandler = (...args: any[]) => void;

export interface AgentEventEmitter extends EventEmitter {
  on(event: EventType, listener: EventHandler): this;
  off(event: EventType, listener: EventHandler): this;
  emit(event: EventType, ...args: any[]): boolean;
}

export interface RealtimeAgentOptions {
  // Add any agent options here
}

export interface AudioHandler {
  muteAudio: () => void;
  unmuteAudio: () => void;
  isMuted: () => boolean;
}

export interface ToolRegistration {
  unregister: () => void;
}

export interface FunctionCallHandler {
  (params: any): Promise<any> | any;
}

export interface ToolCallHandler {
  (toolName: string, params: any): Promise<any> | any;
}

export interface ContextValue {
  [key: string]: any;
}

export interface Context {
  [key: string]: ContextValue;
}

export interface ConversationItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export interface OpenAIOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  // Add other OpenAI options as needed
}

export interface AudioConfig {
  sampleRate?: number;
  channels?: number;
  // Add other audio configuration options as needed
}

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export interface AgentResponse {
  text: string;
  isComplete: boolean;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}
