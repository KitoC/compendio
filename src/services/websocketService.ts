
import { getSupabaseFunctionsUrl, getUseLocalWebSocket } from "@/utils/supabaseUtils";
import { supabase } from "@/integrations/supabase/client";

// Type definitions
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageListeners: ((message: WebSocketMessage) => void)[] = [];
  private openListeners: (() => void)[] = [];
  private closeListeners: (() => void)[] = [];
  private errorListeners: ((error: Event) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isReconnecting = false;
  private reconnectBackoff = 1000; // Start with 1 second, will increase exponentially
  private debugMode = false;

  constructor() {
    // Initialize debug mode from environment variable
    this.debugMode = import.meta.env.VITE_WEBSOCKET_DEBUG === 'true';
    this.debugLog('WebSocketService initialized with debug mode:', this.debugMode);
  }

  private debugLog(...args: any[]) {
    if (this.debugMode) {
      console.log('[WebSocket Debug]', ...args);
    }
  }

  // Check if the WebSocket is currently connected
  public isConnected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  // Connect to the WebSocket server
  public async connect(): Promise<void> {
    // Don't try to connect if already connected or connecting
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.debugLog("WebSocket is already connected or connecting");
      return;
    }

    // Clear any existing reconnection attempt
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data?.session?.access_token;

      // Get the WebSocket URL from the supabase utils
      const baseUrl = getSupabaseFunctionsUrl();
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Convert HTTP/HTTPS URL to WebSocket URL
      let wsUrl = baseUrl.replace(/^https?:\/\//, `${wsProtocol}//`) + '/ai-chat';
      
      // If we're using local WebSocket with remote Supabase, log it
      if (getUseLocalWebSocket()) {
        this.debugLog("Using local WebSocket with remote Supabase");
      }
      
      // If we have an access token, add it as a query parameter
      if (accessToken) {
        wsUrl += `?token=${accessToken}`;
      }
      
      this.debugLog(`Connecting to WebSocket at: ${wsUrl}`);
      
      // If there's an existing socket, close it properly first
      if (this.socket) {
        try {
          this.socket.onclose = null; // Remove the onclose handler to prevent reconnection
          this.socket.close();
        } catch (err) {
          this.debugLog("Error closing existing socket:", err);
        }
      }
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        this.debugLog("WebSocket connection established");
        this.reconnectAttempts = 0;
        this.reconnectBackoff = 1000; // Reset backoff time on successful connection
        this.isReconnecting = false;
        this.openListeners.forEach(listener => listener());
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.debugLog("WebSocket message received:", data);
          this.messageListeners.forEach(listener => listener(data));
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      this.socket.onclose = (event) => {
        this.debugLog(`WebSocket connection closed`, event.code, event.reason);
        this.closeListeners.forEach(listener => listener());
        
        // Only attempt to reconnect if we're not already in the process and we have network connection
        // and the close wasn't a normal closure
        if (!this.isReconnecting && navigator.onLine && 
            this.reconnectAttempts < this.maxReconnectAttempts && 
            event.code !== 1000) { // 1000 is normal closure
          this.attemptReconnect();
        } else if (event.code === 1000) {
          this.debugLog("Normal WebSocket closure - not attempting to reconnect");
        }
      };
      
      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.errorListeners.forEach(listener => listener(error));
        
        // Socket errors often lead to closure, but we'll handle reconnect in onclose
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      throw error;
    }
  }

  // Disconnect from the WebSocket server
  public disconnect(): void {
    if (this.socket) {
      // Use the clean closure code
      this.socket.close(1000, "Normal closure");
      this.socket = null;
    }
    
    // Clear any pending reconnect attempts
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    this.isReconnecting = false;
  }

  private attemptReconnect(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Use exponential backoff for retry timing
    const reconnectDelay = Math.min(30000, this.reconnectBackoff * Math.pow(2, this.reconnectAttempts - 1));
    
    this.debugLog(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${reconnectDelay/1000} seconds...`);
    
    this.reconnectTimeoutId = setTimeout(async () => {
      // Only proceed if we're online
      if (navigator.onLine) {
        try {
          await this.connect();
        } catch (error) {
          console.error("Reconnection attempt failed:", error);
          // If still not connected and we have attempts left, try again
          if (!this.isConnected() && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.isReconnecting = false;
            this.attemptReconnect();
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("Maximum reconnection attempts reached. Please refresh the page.");
            this.isReconnecting = false;
          }
        }
      } else {
        this.debugLog("Network offline, delaying reconnection attempt");
        this.isReconnecting = false;
        
        // Add event listener for online status to trigger reconnect
        const onlineListener = () => {
          window.removeEventListener('online', onlineListener);
          if (!this.isConnected() && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
        window.addEventListener('online', onlineListener);
      }
    }, reconnectDelay);
  }

  // Send a message to the WebSocket server
  public emit(message: any): void {
    if (!this.isConnected()) {
      console.warn("Cannot send message, WebSocket is not connected");
      throw new Error("WebSocket is not connected");
    }
    
    try {
      this.socket!.send(JSON.stringify(message));
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
      throw error;
    }
  }

  // Listen for messages from the WebSocket server
  public listen(handler: (message: WebSocketMessage) => void): () => void {
    this.messageListeners.push(handler);
    
    // Return a function to remove this listener
    return () => {
      this.messageListeners = this.messageListeners.filter(listener => listener !== handler);
    };
  }

  // Register an event handler for when the connection opens
  public onOpen(handler: () => void): () => void {
    this.openListeners.push(handler);
    
    // Return a function to remove this listener
    return () => {
      this.openListeners = this.openListeners.filter(listener => listener !== handler);
    };
  }

  // Register an event handler for when the connection closes
  public onClose(handler: () => void): () => void {
    this.closeListeners.push(handler);
    
    // Return a function to remove this listener
    return () => {
      this.closeListeners = this.closeListeners.filter(listener => listener !== handler);
    };
  }

  // Register an event handler for when an error occurs
  public onError(handler: (error: Event) => void): () => void {
    this.errorListeners.push(handler);
    
    // Return a function to remove this listener
    return () => {
      this.errorListeners = this.errorListeners.filter(listener => listener !== handler);
    };
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
