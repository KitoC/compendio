
import { createContext, useContext } from "react";
import { WebSocketMessage } from "@/services/websocketService";

export interface WebSocketContextType {
  // Connection status
  isConnected: boolean;
  
  // Send methods
  sendMessage: (message: any) => void;
  sendNotification: (title: string, message: string, level?: 'info' | 'success' | 'warning' | 'error') => void;
  
  // Add handler methods - each returns a function to remove the handler
  addMessageHandler: (handler: (message: WebSocketMessage) => void) => () => void;
  addOpenHandler: (handler: () => void) => () => void;
  addCloseHandler: (handler: () => void) => () => void;
  addErrorHandler: (handler: (error: Event) => void) => () => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
