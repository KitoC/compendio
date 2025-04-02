// SocketProvider.tsx
import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SocketContext, SocketMessageListener } from "./SocketContext";
import { dynamicHeaders } from "@/integrations/supabase/client";
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messageListeners = useRef<SocketMessageListener[]>([]);

  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState <= 1) return;

    const socket = new WebSocket("ws://localhost:54321/functions/v1/wss");
    socketRef.current = socket;

    socket.onopen = () => {
      setIsOpen(true);
      if (session?.access_token) {
        socket.send(
          JSON.stringify({
            type: "auth",
            token: session.access_token,
            tenant_id: dynamicHeaders["x-tenant-id"],
          })
        );
      }
    };

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === "Authenticated") {
          setIsAuthenticated(true);
        }

        messageListeners.current.forEach((fn) => fn(data));
      } catch (err) {
        console.error("Invalid WebSocket message:", e.data);
      }
    };

    socket.onclose = () => {
      setIsOpen(false);
      setIsAuthenticated(false);

      setTimeout(connect, 2000);
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };
  }, [session?.access_token]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.close();
    };
  }, [connect]);

  const sendMessage = useCallback((payload: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ ...payload, tenant_id: dynamicHeaders["x-tenant-id"] })
      );
    } else {
      console.warn("WebSocket is not open — message not sent");
    }
  }, []);

  const stopStream = useCallback(() => {
    sendMessage({ type: "stop" });
  }, [sendMessage]);

  const reconnect = useCallback(() => {
    socketRef.current?.close();
    connect();
  }, [connect]);

  const addMessageListener = useCallback((fn: SocketMessageListener) => {
    messageListeners.current.push(fn);
  }, []);

  const removeMessageListener = useCallback((fn: SocketMessageListener) => {
    messageListeners.current = messageListeners.current.filter((f) => f !== fn);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isOpen,
        isAuthenticated,
        sendMessage,
        stopStream,
        reconnect,
        addMessageListener,
        removeMessageListener,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
