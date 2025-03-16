
import { ReactNode, useEffect, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { websocketService, WebSocketMessage } from "@/services/websocketService";
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
    const openHandler = () => setIsConnected(true);
    const closeHandler = () => setIsConnected(false);
    
    const removeOpenHandler = websocketService.addOpenHandler(openHandler);
    const removeCloseHandler = websocketService.addCloseHandler(closeHandler);

    return () => {
      removeOpenHandler();
      removeCloseHandler();
      // Note: We do NOT disconnect the WebSocket here
    };
  }, [user]);

  const contextValue = {
    isConnected,
    sendMessage: (message: any) => websocketService.send(message),
    sendNotification: (title: string, message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') =>
      websocketService.sendNotification(title, message, level),
    addMessageHandler: (handler: (message: WebSocketMessage) => void) => 
      websocketService.addMessageHandler(handler),
    addOpenHandler: (handler: () => void) => 
      websocketService.addOpenHandler(handler),
    addCloseHandler: (handler: () => void) => 
      websocketService.addCloseHandler(handler),
    addErrorHandler: (handler: (error: Event) => void) => 
      websocketService.addErrorHandler(handler)
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
