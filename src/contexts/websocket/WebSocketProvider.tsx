import { ReactNode, useEffect, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { websocketService, WebSocketMessage } from "@/services/websocketService";
import { notificationService } from "@/services/notificationService";
import { useAuth } from "@/hooks/useAuth";
import { getUseLocalWebSocket } from "@/utils/supabaseUtils";

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(websocketService.isConnected());
  const { user } = useAuth();
  const [isFirstConnection, setIsFirstConnection] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Initialize connection when user is authenticated
    const connectWebSocket = async () => {
      try {
        const useLocalWebSocket = getUseLocalWebSocket();
        if (useLocalWebSocket) {
          console.log("WebSocketProvider: Using local WebSocket with remote Supabase");
        }
        
        await websocketService.connect();
        setIsFirstConnection(false);
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error);
      }
    };

    // Only connect if not already connected or if it's the first connection attempt
    if (!websocketService.isConnected() || isFirstConnection) {
      connectWebSocket();
    }

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
  }, [user, isFirstConnection]);

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
