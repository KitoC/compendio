import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  RealtimeAiAgentContext,
  CurrentInteraction,
  Message,
} from "./RealtimAiAgentContext";
import { useRealtimeWebRTC } from "./useRealtimeWebRTC";
import { createPortal } from "react-dom";
import { Assistant } from "./components/assistant/Assistant";
import { v4 as uuidv4 } from "uuid";
const EVENTS = {
  OUTPUT_AUDIO_BUFFER_STARTED: "output_audio_buffer.started",
  OUTPUT_AUDIO_BUFFER_STOPPED: "output_audio_buffer.stopped",
  RESPONSE_AUDIO_TRANSCRIPT_DELTA: "response.audio_transcript.delta",
  RESPONSE_AUDIO_TRANSCRIPT_DONE: "response.audio_transcript.done",
  RESPONSE_CREATED: "response.created",
  RESPONSE_UPDATED: "response.updated",
  RESPONSE_FINISHED: "response.finished",
  RESPONSE_DONE: "response.done",
  RESPONSE_ERROR: "response.error",
  RESPONSE_CANCELLED: "response.cancelled",
  CONVERSATION_DELTA: "conversation.item.input_audio_transcription.delta",
  CONVERSATION_DONE: "conversation.item.input_audio_transcription.completed",
  ASSISTANT_RESPONSE_DELTA: "response.audio_transcript.delta",
  ASSISTANT_RESPONSE_DONE: "response.audio_transcript.done",
};

interface RealtimeAiAgentProviderProps {
  children: ReactNode;
}

export const RealtimeAiAgentProvider = ({
  children,
}: RealtimeAiAgentProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [assistantTalking, setAssistantTalking] = useState(false);

  const [currentInteraction, setCurrentInteraction] =
    useState<CurrentInteraction>({
      user: { role: "user", content: "", done: false },
      assistant: { role: "assistant", content: "", done: false },
    });

  const { startSession, stopSession, sendMessage, error, dc } =
    useRealtimeWebRTC();

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
      dc.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === EVENTS.OUTPUT_AUDIO_BUFFER_STARTED) {
          setAssistantTalking(true);
        }

        if (data.type === EVENTS.OUTPUT_AUDIO_BUFFER_STOPPED) {
          setAssistantTalking(false);
        }

        // if(data.type)
        if (data.type === EVENTS.ASSISTANT_RESPONSE_DELTA) {
          setCurrentInteraction((prev) => ({
            ...prev,
            assistant: {
              role: "assistant",
              content: prev.assistant.content + data.delta,
              done: false,
            },
          }));
        }

        if (data.type === EVENTS.ASSISTANT_RESPONSE_DONE) {
          setCurrentInteraction((prev) => ({
            ...prev,
            assistant: {
              role: "assistant",
              content: data.transcript,
              done: true,
            },
          }));
        }

        if (data.type === EVENTS.CONVERSATION_DELTA) {
          setCurrentInteraction((prev) => ({
            ...prev,
            user: {
              role: "user",
              content: prev.user.content + data.delta,
              done: false,
            },
          }));
        }

        if (data.type === EVENTS.CONVERSATION_DONE) {
          setCurrentInteraction((prev) => ({
            ...prev,
            user: { role: "user", content: data.transcript, done: true },
          }));
        }
      };
    }
  }, [dc]);

  useEffect(() => {
    if (currentInteraction.user.done && currentInteraction.assistant.done) {
      setMessages((prev) => [
        ...prev,
        currentInteraction.user,
        currentInteraction.assistant,
      ]);
      setCurrentInteraction({
        user: { role: "user", content: "", done: false },
        assistant: { role: "assistant", content: "", done: false },
      });
    }
  }, [currentInteraction]);

  const value = useMemo(
    () => ({
      transcript,
      startListening,
      stopListening,
      isListening,
      error,
      isConnecting,
      assistantTalking,
      currentInteraction,
      messages,
    }),
    [
      transcript,
      startListening,
      stopListening,
      isListening,
      error,
      isConnecting,
      assistantTalking,
      currentInteraction,
      messages,
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
