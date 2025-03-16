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
  const [hasBeenDisconnected, setHasBeenDisconnected] = useState(false);

  const debugMode = import.meta.env.VITE_WEBSOCKET_DEBUG === 'true';
  const debugLog = (...args: any[]) => {
    if (debugMode) {
      console.log('[WebSocketProvider Debug]', ...args);
    }
  };

  useEffect(() => {
    if (!user) return;

    debugLog("User authenticated, preparing WebSocket connection");

    const connectWebSocket = async () => {
      try {
        const useLocalWebSocket = getUseLocalWebSocket();
        if (useLocalWebSocket) {
          debugLog("Using local WebSocket with remote Supabase");
        }
        
        await websocketService.connect();
        setIsFirstConnection(false);
      } catch (error) {
        console.error("Failed to connect to WebSocket:", error);
      }
    };

    if (!websocketService.isConnected() || isFirstConnection || hasBeenDisconnected) {
      debugLog("Connecting WebSocket", { 
        isFirstConnection, 
        hasBeenDisconnected,
        isCurrentlyConnected: websocketService.isConnected()
      });
      connectWebSocket();
      setHasBeenDisconnected(false);
    }

    const removeOpenHandler = websocketService.onOpen(() => {
      debugLog("WebSocket connected in provider");
      setIsConnected(true);
    });
    
    const removeCloseHandler = websocketService.onClose(() => {
      debugLog("WebSocket disconnected in provider");
      setIsConnected(false);
      setHasBeenDisconnected(true);
    });
    
    const removeErrorHandler = websocketService.onError((error) => {
      console.error("WebSocket error in provider:", error);
      setIsConnected(false);
      setHasBeenDisconnected(true);
    });

    const handleOnline = () => {
      debugLog("Network connection restored, reconnecting WebSocket");
      if (!websocketService.isConnected()) {
        connectWebSocket();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !websocketService.isConnected()) {
        debugLog("Page became visible, checking WebSocket connection");
        connectWebSocket();
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      debugLog("Cleaning up WebSocket event handlers");
      removeOpenHandler();
      removeCloseHandler();
      removeErrorHandler();
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Note: We do NOT disconnect the WebSocket here to keep it persistent
    };
  }, [user, isFirstConnection, hasBeenDisconnected, debugMode]);

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
