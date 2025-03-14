import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { IMessage, MessageRole } from "../ai/types";
import { useAppConfig } from "../appConfig";
import debounce from "lodash/debounce";
import dayjs from "dayjs";
import usePrevious from "react-use/lib/usePrevious";
import isEqual from "lodash/isEqual";
import useEffectOnce from "react-use/lib/useEffectOnce";
import { useChatWidgetUI } from "../chatWidgetUI/context";
import sortBy from "lodash/sortBy";
import { useAI } from "../ai";
import { createMessage } from "../../utils/createMessage";
import conversationsService from "../../services/supabase/conversations";

const useMessages = () => {
  const { userId, domain, chatWidgetConfig } = useAppConfig();
  const { isOpen } = useChatWidgetUI();
  const { sessionId, setSessionId, sendMessage, isStreaming } = useAI();

  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<IMessage[]>([]);

  const previousMessages = usePrevious(messages);
  const previousConversationId = usePrevious(sessionId);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleAssistantMessage = useCallback(
    async (newMessages: IMessage[]) => {
      const newMessage = createMessage({
        role: MessageRole.ASSISTANT,
        content: "",
        loading: true,
      });

      setMessages((prev) => [...prev, newMessage]);

      const response = await sendMessage({
        messages: newMessages,
        onUpdate: (text) => {
          newMessage.content = text;
          // Handle incremental updates here
          setMessages((prev) =>
            prev.map((message) =>
              message.id === newMessage.id ? newMessage : message
            )
          );
        },
      });

      newMessage.content = response;
      newMessage.loading = false;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === newMessage.id ? newMessage : message
        )
      );
    },
    [sendMessage]
  );

  const scrollToOptimalPosition = useCallback(
    ({ behavior = "smooth" }: { behavior?: ScrollBehavior } = {}) => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const userMessages = container.querySelectorAll(
          '[data-user-message="true"]'
        );

        const lastUserMessage = userMessages[userMessages.length - 1];

        if (lastUserMessage) {
          lastUserMessage.scrollIntoView({
            behavior,
            block: "start",
          });
        } else {
          container.scrollTo({
            top: container.scrollHeight - container.clientHeight,
            behavior,
          });
        }
      }
    },
    []
  );

  const setInitialMessage = useCallback(async () => {
    const initialMessage = `Trigger get_sub_workflow_initiator_form and welcome the user.`;

    handleAssistantMessage([
      createMessage({ role: MessageRole.SYSTEM, content: initialMessage }),
    ]);
  }, [handleAssistantMessage]);

  const loadPreviousConversations = useCallback(async () => {
    const conversations = await conversationsService.getMany((chain) =>
      chain.eq("domain", domain).order("updated_at", { ascending: true })
    );

    const lastConversation = sortBy(conversations, "updated_at")[
      conversations.length - 1
    ];

    if (!lastConversation) {
      setIsHistoryLoaded(true);
      setInitialMessage();

      return;
    }

    const { persistIfLessThan = "1 day" } =
      chatWidgetConfig?.previousConversations || {};

    const [num, unit] = persistIfLessThan.split(" ");

    const shouldLoadLastConversation =
      dayjs().diff(
        dayjs(lastConversation.updated_at),
        unit as dayjs.UnitType
      ) <= Number(num);

    if (lastConversation && shouldLoadLastConversation) {
      setSessionId(lastConversation.id);
      setMessages(lastConversation.thread as IMessage[]);
    }

    setIsHistoryLoaded(true);
  }, [
    domain,
    conversationsService,
    chatWidgetConfig,
    setSessionId,
    setInitialMessage,
  ]);

  const debouncedHandleConversationUpdates = useMemo(
    () =>
      debounce(async () => {
        await conversationsService.upsert({
          domain,
          userId,
          thread: messages,
          id: sessionId,
        });
      }, 1000), // 1 second delay
    [sessionId, conversationsService, messages, domain, userId]
  );

  useEffectOnce(() => {
    loadPreviousConversations();
  });

  useEffect(() => {
    const shouldPersist =
      messages.length > 1 &&
      isHistoryLoaded &&
      !isEqual(previousMessages, messages) &&
      sessionId === previousConversationId;

    if (shouldPersist && !isStreaming) {
      debouncedHandleConversationUpdates();
    }

    // Cleanup the debounced function
    return () => {
      debouncedHandleConversationUpdates.cancel();
    };
  }, [
    messages,
    debouncedHandleConversationUpdates,
    isHistoryLoaded,
    previousMessages,
    sessionId,
    previousConversationId,
    isStreaming,
  ]);

  useEffect(() => {
    if (isOpen) {
      scrollToOptimalPosition({ behavior: "instant" });
    }
  }, [scrollToOptimalPosition, isOpen]);

  useEffect(() => {
    localStorage.setItem("userId", userId);
  }, [userId]);

  useEffect(() => {
    if (!isTyping) {
      inputRef.current?.focus();
      setTimeout(scrollToOptimalPosition, 100);
    }
  }, [isTyping, messages, scrollToOptimalPosition]);

  return {
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    messagesContainerRef,
    inputRef,
    scrollToOptimalPosition,
    handleAssistantMessage,
  };
};

export default useMessages;
