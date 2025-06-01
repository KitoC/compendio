import { useCallback, useEffect, useMemo, useState } from "react";
import { ROLES, Interaction } from "../types";

export const useMessagingAndTranscriptions = ({ realtimeAgent }) => {
  const [messages, setMessages] = useState([]);
  const [assistantTalking, setAssistantTalking] = useState(false);

  const [currentInteraction, setCurrentInteraction] = useState<Interaction>({
    user: { role: ROLES.USER, content: "", done: false },
    assistant: { role: ROLES.ASSISTANT, content: "", done: false },
  });

  const resetMessageState = useCallback(() => {
    setMessages([]);
    setCurrentInteraction({
      user: { role: ROLES.USER, content: "", done: false },
      assistant: { role: ROLES.ASSISTANT, content: "", done: false },
    });
    setAssistantTalking(false);
  }, []);

  useEffect(() => {
    realtimeAgent?.onAgentTalking((isTalking) => {
      setAssistantTalking(isTalking);
    });
  }, [realtimeAgent]);

  useEffect(() => {
    realtimeAgent?.onAgentResponseDelta(({ text, done }) => {
      setCurrentInteraction((prev) => ({
        ...prev,
        assistant: {
          role: ROLES.ASSISTANT,
          content: prev.assistant.content + text,
          done,
        },
      }));
    });
  }, [realtimeAgent]);

  useEffect(() => {
    realtimeAgent?.onAgentResponseDone(({ text, done }) => {
      setCurrentInteraction((prev) => ({
        ...prev,
        assistant: { role: ROLES.ASSISTANT, content: text, done },
      }));
    });
  }, [realtimeAgent]);

  useEffect(() => {
    realtimeAgent?.onUserTranscriptionDelta(({ text, done }) => {
      setCurrentInteraction((prev) => ({
        ...prev,
        user: { role: ROLES.USER, content: prev.user.content + text, done },
      }));
    });
  }, [realtimeAgent]);

  useEffect(() => {
    realtimeAgent?.onUserTranscriptionDone(({ text, done }) => {
      setCurrentInteraction((prev) => ({
        ...prev,
        user: { role: ROLES.USER, content: text, done },
      }));
    });
  }, [realtimeAgent]);

  useEffect(() => {
    if (currentInteraction.user.done && currentInteraction.assistant.done) {
      setMessages((prev) => [
        ...prev,
        currentInteraction.user,
        currentInteraction.assistant,
      ]);
      setCurrentInteraction({
        user: { role: ROLES.USER, content: "", done: false },
        assistant: { role: ROLES.ASSISTANT, content: "", done: false },
      });
    }
  }, [currentInteraction]);

  useEffect(() => {
    return realtimeAgent?.onConversationItemCreated(({ data }) => {
      if (data?.item?.role === ROLES.USER && data?.item?.content[0]?.text) {
        realtimeAgent?.createAiResponse({
          instructions: "Respond to user's message",
        });
      }
    });
  }, [realtimeAgent]);

  const sendMessage = useCallback(
    (message) => {
      realtimeAgent?.interruptAudio();
      realtimeAgent?.createUserMessage({ text: message });

      setCurrentInteraction({
        user: { role: ROLES.USER, content: message, done: true },
        assistant: { role: ROLES.ASSISTANT, content: "", done: false },
      });
    },
    [realtimeAgent]
  );

  const messagesWithTranscriptions = useMemo(() => {
    const allMessages = [...messages];

    if (currentInteraction.user.content) {
      allMessages.push(currentInteraction.user);
    }

    if (
      currentInteraction.assistant.content &&
      currentInteraction.user.content
    ) {
      allMessages.push(currentInteraction.assistant);
    }

    return allMessages;
  }, [messages, currentInteraction]);

  return {
    messages: messagesWithTranscriptions,
    setMessages,
    currentInteraction,
    setCurrentInteraction,
    assistantTalking,
    sendMessage,
    resetMessageState,
  };
};
