
import { createContext, useContext } from "react";
import { WebSocketMessage } from "@/services/websocketService";
import { NotificationLevel } from "@/services/notificationService";

export interface WebSocketContextType {
  // Connection status
  isConnected: boolean;
  
  // Core WebSocket methods
  emit: (message: any) => void;
  listen: (handler: (message: WebSocketMessage) => void) => () => void;
  
  // Notification method (kept for backward compatibility)
  sendNotification: (title: string, message: string, level?: NotificationLevel) => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
