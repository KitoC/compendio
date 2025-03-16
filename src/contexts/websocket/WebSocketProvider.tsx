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
    const removeOpenHandler = websocketService.onOpen(() => {
      console.log("WebSocket connected in provider");
      setIsConnected(true);
    });
    
    const removeCloseHandler = websocketService.onClose(() => {
      console.log("WebSocket disconnected in provider");
      setIsConnected(false);
    });
    
    const removeErrorHandler = websocketService.onError((error) => {
      console.error("WebSocket error in provider:", error);
      setIsConnected(false);
    });

    // Setup network status event listeners to handle reconnection when network changes
    const handleOnline = () => {
      console.log("Network connection restored, reconnecting WebSocket");
      if (!websocketService.isConnected()) {
        connectWebSocket();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      removeOpenHandler();
      removeCloseHandler();
      removeErrorHandler();
      window.removeEventListener('online', handleOnline);
      
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
