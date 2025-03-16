
import { supabase } from "@/integrations/supabase/client";
import { getSupabaseFunctionsUrl } from "@/utils/supabaseUtils";

interface WebSocketOptions {
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  debug?: boolean;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private options: WebSocketOptions = {};
  private debug: boolean = false;

  constructor() {
    this.debug = import.meta.env.VITE_WEBSOCKET_DEBUG === "true";
  }

  public async connect(options: WebSocketOptions = {}) {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      this.log("WebSocket is already connected or connecting");
      return;
    }

    this.options = options;
    this.debug = options.debug || this.debug;

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      // Use environment variable if available, otherwise construct from supabase URL
      let websocketUrl = import.meta.env.VITE_WEBSOCKET_URL;
      
      if (!websocketUrl) {
        // Convert HTTP to WS protocol
        const functionsUrl = getSupabaseFunctionsUrl("v1");
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const httpUrl = new URL(functionsUrl);
        websocketUrl = `${wsProtocol}//${httpUrl.host}${httpUrl.pathname}/ws-chat`;
      }

      this.log(`Connecting to WebSocket at: ${websocketUrl}`);
      this.socket = new WebSocket(websocketUrl);

      this.socket.onopen = (event) => {
        this.log("WebSocket connection established");
        if (this.options.onOpen) this.options.onOpen(event);
      };

      this.socket.onmessage = (event) => {
        this.log(`Received message: ${event.data}`);
        if (this.options.onMessage) this.options.onMessage(event);
      };

      this.socket.onclose = (event) => {
        this.log(`WebSocket connection closed ${event.code} ${event.reason}`);
        if (this.options.onClose) this.options.onClose(event);
        this.socket = null;
      };

      this.socket.onerror = (event) => {
        this.log("WebSocket error", event);
        if (this.options.onError) this.options.onError(event);
      };
    } catch (error) {
      this.log("Error connecting to WebSocket:", error);
    }
  }

  public send(message: any) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.log("Cannot send message: WebSocket is not connected");
      return false;
    }

    try {
      const messageString = typeof message === "string" ? message : JSON.stringify(message);
      this.socket.send(messageString);
      this.log(`Sent message: ${messageString}`);
      return true;
    } catch (error) {
      this.log("Error sending message:", error);
      return false;
    }
  }

  public disconnect() {
    if (this.socket) {
      this.log("Closing WebSocket connection");
      this.socket.close(1000, "Client closed connection");
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log("[WebSocket Debug]", ...args);
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// React Hook for WebSocket
export const useWebSocket = () => {
  return {
    connect: websocketService.connect.bind(websocketService),
    send: websocketService.send.bind(websocketService),
    disconnect: websocketService.disconnect.bind(websocketService),
    isConnected: websocketService.isConnected.bind(websocketService),
  };
};
