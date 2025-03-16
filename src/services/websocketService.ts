
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

  public async connect(options: WebSocketConnectionOptions = {}): Promise<WebSocket> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.socket;
    }

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
    this.options = options;
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
        
        if (this.options.onOpen) {
          this.options.onOpen();
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message);
          
          if (this.options.onMessage) {
            this.options.onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.socket = null;
        this.isConnecting = false;
        
        if (this.options.onClose) {
          this.options.onClose();
        }
        
        // Attempt to reconnect only if not intentionally disconnected
        if (!this.intentionalDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          
          setTimeout(() => {
            this.connect(this.options).catch(err => {
              console.error('Reconnection failed:', err);
            });
          }, this.reconnectTimeout * this.reconnectAttempts);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        if (this.options.onError) {
          this.options.onError(error);
        }
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
        this.connect(this.options).catch(err => {
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
