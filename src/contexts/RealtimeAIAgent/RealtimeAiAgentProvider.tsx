import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { RealtimeAiAgentContext } from "./RealtimAiAgentContext";
import { useRealtimeWebRTC } from "./useRealtimeWebRTC";
import { createPortal } from "react-dom";
import { Assistant } from "./components/assistant/Assistant";
import { useMessagingAndTranscriptions } from "./hooks/useMessagingAndTranscriptions";
import { ToolsAndHandlers } from "./types";
import { useGlobalToolHandler } from "./hooks/useGlobalToolHandler";

interface RealtimeAiAgentProviderProps {
  children: ReactNode;
  globalTools: ToolsAndHandlers;
}

export const RealtimeAiAgentProvider = ({
  children,
  globalTools,
}: RealtimeAiAgentProviderProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { startSession, stopSession, error, dc } = useRealtimeWebRTC();

  useEffect(() => {
    if (dc) {
      dc.onerror = (err) => {
        console.log("dc error", err);
      };
    }
  }, [dc]);

  const { messages, currentInteraction, assistantTalking } =
    useMessagingAndTranscriptions({ dc });
  const globalToolsHandler = useGlobalToolHandler({
    dc,
    isListening,
    globalTools,
  });

  const startListening = useCallback(() => {
    setIsConnecting(true);
    startSession({
      onOpen: ({ dc }) => {
        setIsListening(true);
        setIsConnecting(false);
      },
    });
  }, [startSession]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    stopSession();
  }, [stopSession]);

  useEffect(() => {
    if (dc) {
      dc.onclose = () => {
        stopListening();
      };
    }
  }, [dc, stopListening]);

  const value = useMemo(
    () => ({
      startListening,
      stopListening,
      isListening,
      error,
      isConnecting,
      assistantTalking,
      currentInteraction,
      messages,
      ...globalToolsHandler,
    }),
    [
      startListening,
      stopListening,
      isListening,
      error,
      isConnecting,
      assistantTalking,
      currentInteraction,
      messages,
      globalToolsHandler,
    ]
  );

  return (
    <RealtimeAiAgentContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed inset-0 pointer-events-none">
          <Assistant />
        </div>,
        document.body
      )}
    </RealtimeAiAgentContext.Provider>
  );
};
