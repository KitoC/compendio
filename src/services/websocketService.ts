
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionsUrl } from "@/utils/supabaseUtils";

export type WebSocketMessageType = 
  | 'echo'
  | 'agent.typing'
  | 'agent.response'
  | 'conversation.update'
  | 'notification'
  | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: any;
}

export interface WebSocketConnectionOptions {
  onOpen?: () => void;
  onMessage?: (message: WebSocketMessage) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnecting: boolean = false;
  private messageQueue: any[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 1000;
  private options: WebSocketConnectionOptions = {};
  private intentionalDisconnect: boolean = false;
  private messageHandlers: Array<(message: WebSocketMessage) => void> = [];
  private openHandlers: Array<() => void> = [];
  private closeHandlers: Array<() => void> = [];
  private errorHandlers: Array<(error: Event) => void> = [];

  // Initialize with basic handlers that maintain connection lists
  constructor() {
    // Set default empty handlers to avoid null checks
    this.options = {
      onOpen: () => {},
      onMessage: () => {},
      onClose: () => {},
      onError: () => {},
    };
  }

  public async connect(): Promise<WebSocket> {
    // If already connected, return the existing socket
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    // If currently connecting, wait for the connection to complete
    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            clearInterval(checkInterval);
            resolve(this.socket);
          }
        }, 100);
      });
    }

    this.isConnecting = true;
    this.intentionalDisconnect = false;

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Create WebSocket connection
      const wsUrl = getSupabaseFunctionsUrl().replace('https://', 'wss://') + '/ai-chat';
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Send any queued messages
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          this.send(message);
        }
        
        // Notify all registered open handlers
        this.openHandlers.forEach(handler => handler());
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message);
          
          // Notify all registered message handlers
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.socket = null;
        this.isConnecting = false;
        
        // Notify all registered close handlers
        this.closeHandlers.forEach(handler => handler());
        
        // Attempt to reconnect only if not intentionally disconnected
        if (!this.intentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          
          setTimeout(() => {
            this.connect().catch(err => {
              console.error('Reconnection failed:', err);
            });
          }, this.reconnectTimeout * this.reconnectAttempts);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Notify all registered error handlers
        this.errorHandlers.forEach(handler => handler(error));
      };

      return this.socket;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  public send(message: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
      
      if (!this.isConnecting) {
        this.connect().catch(err => {
          console.error('Connection attempt failed:', err);
        });
      }
      return;
    }

    try {
      this.socket.send(typeof message === 'string' ? message : JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.messageQueue.push(message);
    }
  }

  public sendNotification(title: string, message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.send({
      type: 'notification',
      title,
      message,
      level,
      timestamp: new Date().toISOString()
    });
  }

  // Add a message handler that will receive all WebSocket messages
  public addMessageHandler(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.push(handler);
    // Return a function to remove this handler
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Add an open handler that will be called when the WebSocket opens
  public addOpenHandler(handler: () => void): () => void {
    this.openHandlers.push(handler);
    return () => {
      this.openHandlers = this.openHandlers.filter(h => h !== handler);
    };
  }

  // Add a close handler that will be called when the WebSocket closes
  public addCloseHandler(handler: () => void): () => void {
    this.closeHandlers.push(handler);
    return () => {
      this.closeHandlers = this.closeHandlers.filter(h => h !== handler);
    };
  }

  // Add an error handler that will be called when the WebSocket has an error
  public addErrorHandler(handler: (error: Event) => void): () => void {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }

  public disconnect(): void {
    this.intentionalDisconnect = true;
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnecting = false;
    this.messageQueue = [];
    this.reconnectAttempts = 0;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
