import { Message } from "../RealtimAiAgentContext";
import { useEffect, useState } from "react";
import { CurrentInteraction } from "../RealtimAiAgentContext";
import { EVENTS } from "../consts";

export const useMessagingAndTranscriptions = ({ dc }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantTalking, setAssistantTalking] = useState(false);

  const [currentInteraction, setCurrentInteraction] =
    useState<CurrentInteraction>({
      user: { role: "user", content: "", done: false },
      assistant: { role: "assistant", content: "", done: false },
    });

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

  return {
    messages,
    setMessages,
    currentInteraction,
    setCurrentInteraction,
    assistantTalking,
  };
};
