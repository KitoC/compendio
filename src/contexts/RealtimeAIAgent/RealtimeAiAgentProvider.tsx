import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { RealtimeAiAgentContext } from "./RealtimAiAgentContext";
import Assistant from "./components/assistant/Assistant";
import { useMessagingAndTranscriptions } from "./hooks/useMessagingAndTranscriptions";
import useGlobalTools from "./hooks/useGlobalTools";
import { RealtimeAgent } from "./RealtimeAgent/RealtimeAgent";

const realtimeAgent = new RealtimeAgent();

export const RealtimeAiAgentProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const {
    messages,
    currentInteraction,
    assistantTalking,
    sendMessage,
    resetMessageState,
  } = useMessagingAndTranscriptions({ realtimeAgent });

  useGlobalTools({ realtimeAgent });

  const startListening = useCallback(() => {
    setIsConnecting(true);

    realtimeAgent?.connect();
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);

    if (isMuted) {
      realtimeAgent?.unmuteAudio();
    } else {
      realtimeAgent?.muteAudio();
    }
  }, [isMuted]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    realtimeAgent?.disconnect();
  }, []);

  useEffect(() => {
    return realtimeAgent?.onConnect(() => {
      setIsListening(true);
      setIsConnecting(false);
      setIsConnected(true);
    });
  }, []);

  useEffect(() => {
    return realtimeAgent?.onDisconnect(() => {
      setIsListening(false);
      setIsConnected(false);
    });
  }, []);

  useEffect(() => {
    return realtimeAgent?.onError((err) => {
      setError(err);
    });
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
    resetMessageState();
  }, [resetMessageState]);

  const value = useMemo(
    () => ({
      realtimeAgent,
      startListening,
      stopListening,
      isListening,
      error,
      isConnecting,
      assistantTalking,
      currentInteraction,
      messages,
      isConnected,
      toggleMute,
      isMuted,
      sendMessage,
      setError,
      dismissError,
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
      isConnected,
      toggleMute,
      isMuted,
      sendMessage,
      setError,
      dismissError,
    ]
  );

  return (
    <RealtimeAiAgentContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          style={{
            pointerEvents: "none",
            position: "fixed",
            inset: 0,
            zIndex: 500,
          }}
        >
          <Assistant />
        </div>,
        document.body
      )}
    </RealtimeAiAgentContext.Provider>
  );
};

RealtimeAiAgentProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
