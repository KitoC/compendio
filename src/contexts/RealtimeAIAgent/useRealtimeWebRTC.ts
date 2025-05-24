import { useCallback, useEffect, useRef, useState } from "react";
import {
  initializeWebRTCConnection,
  InitializeWebRTCConnectionOpenProps,
  InitializeWebRTCConnectionProps,
} from "./utils/initializeWebRTCConnection";

export const useRealtimeWebRTC = () => {
  const realtimeWebRtcArgsRef =
    useRef<InitializeWebRTCConnectionOpenProps | null>(null);

  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(
    (realtimeArgs: InitializeWebRTCConnectionProps) => {
      return initializeWebRTCConnection({
        ...realtimeArgs,
        onOpen: (args) => {
          realtimeWebRtcArgsRef.current = args;
          realtimeArgs?.onOpen?.(args);
        },
        onError: (error) => {
          setError(error as string);
          realtimeArgs?.onError?.(error);
        },
      });
    },
    []
  );

  const stopSession = useCallback(() => {
    realtimeWebRtcArgsRef.current?.dc.close();
    realtimeWebRtcArgsRef.current?.pc.close();
    realtimeWebRtcArgsRef.current?.ms.getTracks().forEach((track) => {
      track.stop();
    });

    realtimeWebRtcArgsRef.current = null;
  }, []);

  const sendMessage = useCallback((message: string) => {
    realtimeWebRtcArgsRef.current?.dc.send(message);
  }, []);

  return {
    startSession,
    stopSession,
    sendMessage,
    error,
    ...(realtimeWebRtcArgsRef.current || {}),
  };
};
