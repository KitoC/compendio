type EventCallback = (...args: unknown[]) => void;

export interface EventMap {
  "chat:open": EventCallback;
  "chat:close": EventCallback;
  "chat:toggle": EventCallback;
  "chat:message": EventCallback;
}

class EventEmitter {
  private events: Map<keyof EventMap, Set<EventCallback>>;

  constructor() {
    this.events = new Map();
  }

  on<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)?.add(callback as EventCallback);
  }

  off<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
    this.events.get(event)?.delete(callback as EventCallback);
  }

  emit<K extends keyof EventMap>(
    event: K,
    ...args: Parameters<EventMap[K]>
  ): void {
    this.events.get(event)?.forEach((callback) => {
      callback(...args);
    });
  }

  once<K extends keyof EventMap>(event: K, callback: EventMap[K]): void {
    const onceCallback = (...args: Parameters<EventMap[K]>) => {
      this.off(event, onceCallback as EventMap[K]);
      (callback as EventCallback)(...args);
    };
    this.on(event, onceCallback as EventMap[K]);
  }
}

export const eventEmitter = new EventEmitter();
