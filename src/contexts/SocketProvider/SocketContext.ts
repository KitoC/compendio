import { createContext, useContext } from "react";

export type SocketData<T> = {
  type: string;
  value: T;
};

export type SocketMessageListener = (data: SocketData<unknown>) => void;

interface SocketContextValue {
  socket: WebSocket | null;
  isOpen: boolean;
  isAuthenticated: boolean;
  sendMessage: (payload: object) => void;
  stopStream: () => void;
  reconnect: () => void;
  addMessageListener: (fn: SocketMessageListener) => void;
  removeMessageListener: (fn: SocketMessageListener) => void;
}

export const SocketContext = createContext<SocketContextValue | undefined>(
  undefined
);

export const useSocket = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
