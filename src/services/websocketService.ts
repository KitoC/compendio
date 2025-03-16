
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionsUrl } from "@/utils/supabaseUtils";

export type WebSocketMessageType = 
  | 'echo'
  | 'agent.typing'
  | 'agent.response'
  | 'conversation.update'
  | 'notification'
  | 'error'
  | 'chat.message';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: any;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private isConnecting: boolean = false;
  private messageQueue: any[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 1000;
  private intentionalDisconnect: boolean = false;
  private messageHandlers: Array<(message: WebSocketMessage) => void> = [];
  private openHandlers: Array<() => void> = [];
  private closeHandlers: Array<() => void> = [];
  private errorHandlers: Array<(error: Event) => void> = [];
  private authToken: string | null = null;

  // Connect to the WebSocket server
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
      this.authToken = session?.access_token || null;

      if (!this.authToken) {
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
          this.emit(message);
        }
        
        // Notify all registered open handlers
        this.openHandlers.forEach(handler => handler());
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('WebSocket message received:', message);
          
          // Notify all registered message handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        this.socket = null;
        this.isConnecting = false;
        
        // Notify all registered close handlers
        this.closeHandlers.forEach(handler => handler());
        
        // Only attempt to reconnect if:
        // 1. Not intentionally disconnected
        // 2. We haven't exceeded max attempts
        // 3. The close wasn't due to an authentication issue (code 4001)
        // 4. The browser isn't offline
        if (!this.intentionalDisconnect && 
            this.reconnectAttempts < this.maxReconnectAttempts && 
            event.code !== 4001 &&
            navigator.onLine) {
          
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          
          // Use exponential backoff for reconnection
          const delay = this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1);
          
          setTimeout(() => {
            // Check if we're still online before attempting to reconnect
            if (navigator.onLine) {
              this.connect().catch(err => {
                console.error('Reconnection failed:', err);
              });
            }
          }, delay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.log('Max reconnection attempts reached, giving up');
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

  // Send a message to the server
  public emit(message: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(message);
      
      if (!this.isConnecting && navigator.onLine) {
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

  // Listen for messages of a specific type
  public listen(handler: (message: WebSocketMessage) => void): () => void {
    this.messageHandlers.push(handler);
    // Return a function to remove this handler
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Listen for connection open events
  public onOpen(handler: () => void): () => void {
    this.openHandlers.push(handler);
    return () => {
      this.openHandlers = this.openHandlers.filter(h => h !== handler);
    };
  }

  // Listen for connection close events
  public onClose(handler: () => void): () => void {
    this.closeHandlers.push(handler);
    return () => {
      this.closeHandlers = this.closeHandlers.filter(h => h !== handler);
    };
  }

  // Listen for connection error events
  public onError(handler: (error: Event) => void): () => void {
    this.errorHandlers.push(handler);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
    };
  }

  // Check if connected
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // Disconnect from the server
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
}

// Export singleton instance
export const websocketService = new WebSocketService();
