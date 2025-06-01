// Core exports
export { default as RealtimeAgent } from './RealtimeAgent';
export { default as AudioHandler } from './AudioHandler';
export { default as OpenAIProvider, ROLES } from './OpenAIProvider';

// Event system
export { default as AgentEventEmitter, EVENTS } from './EventEmitter';

type EventType = string; // Re-export for backward compatibility
export type { EventType };

// Default export for backward compatibility
export { RealtimeAgent as default } from './RealtimeAgent';
