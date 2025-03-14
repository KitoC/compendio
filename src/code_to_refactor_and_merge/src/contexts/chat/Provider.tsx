import { ReactNode, FC, useEffect } from "react";
import { useAI } from "../ai";
import { ChatContext } from "./context";
import { useAppConfig } from "../appConfig";
import useMessages from "./useMessages";
import { createMessage } from "../../utils/createMessage";
import { IMessage, MessageRole } from "../ai/types";

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: FC<ChatProviderProps> = ({ children }) => {
  const { isLoading: _aiLoading } = useAI();
  const appConfig = useAppConfig();
  const { userId } = appConfig;
  const {
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    messagesContainerRef,
    inputRef,
    scrollToOptimalPosition,
    handleAssistantMessage,
  } = useMessages();

  useEffect(() => {
    appConfig.socket.on("form-response", (response: IMessage) => {
      setMessages((prev) => {
        if (prev.find((message) => message.id === response.id)) {
          return prev.map((message) =>
            message.id === response.id ? response : message
          );
        } else {
          return [...prev, response];
        }
      });
    });
  }, [appConfig.socket, setMessages]);

  const handleSendMessage = async (
    content: string,
    role: MessageRole = MessageRole.USER
  ) => {
    const newMessages = [...messages, createMessage({ content, role })];
    setMessages(newMessages);
    setIsTyping(true);
    setTimeout(scrollToOptimalPosition, 100);

    try {
      handleAssistantMessage(newMessages);
    } catch (_error) {
      console.error(_error);
      setMessages((prev) => [
        ...prev,
        createMessage({
          role: MessageRole.ASSISTANT,
          content: "Sorry, I encountered an error. Please try again.",
        }),
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const value = {
    messages,
    isTyping,
    userId,
    messagesContainerRef,
    inputRef,
    handleSendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
