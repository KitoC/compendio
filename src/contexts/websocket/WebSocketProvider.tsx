import { ReactNode, useEffect, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { websocketService, WebSocketMessage } from "@/services/websocketService";
import { notificationService } from "@/services/notificationService";
import { useAuth } from "@/hooks/useAuth";

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(websocketService.isConnected());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Initialize connection when user is authenticated
    const connectWebSocket = async () => {
      try {
        await websocketService.connect();
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error);
      }
    };

    connectWebSocket();

    // Setup connection status handlers
    const removeOpenHandler = websocketService.onOpen(() => setIsConnected(true));
    const removeCloseHandler = websocketService.onClose(() => setIsConnected(false));
    const removeErrorHandler = websocketService.onError((error) => {
      console.error("WebSocket error in provider:", error);
      setIsConnected(false);
    });

    return () => {
      removeOpenHandler();
      removeCloseHandler();
      removeErrorHandler();
      // Note: We do NOT disconnect the WebSocket here to keep it persistent
    };
  }, [user]);

  const contextValue = {
    isConnected,
    emit: (message: any) => websocketService.emit(message),
    listen: (handler: (message: WebSocketMessage) => void) => 
      websocketService.listen(handler),
    sendNotification: (title: string, message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') =>
      notificationService.sendNotification(title, message, level)
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
