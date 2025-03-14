import styled from "styled-components";
import { FC, useRef } from "react";
import Avatar from "./Avatar";
import { useTheme } from "../../contexts/theme";
import { FormBuilder } from "../form-builder";
import { useChat } from "../../contexts/chat/context";
import RenderMarkdown from "../common/RenderMarkdown";
import { IMessage, MessageRole } from "../../contexts/ai/types";
import { FormButton, OptionCardType, FormConfig } from "../form-builder/types";
import clsx from "clsx";

const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  margin-bottom: 1rem;
  flex-direction: ${(props) => (props.isUser ? "row-reverse" : "row")};
  width: fit-content;
  ${(props) =>
    props.isUser &&
    `
    margin-left: auto;
  `}
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  border-radius: 1rem;
  backdrop-filter: blur(12px);

  ${(props) =>
    props.isUser
      ? `
    margin-left: 0.75rem;
    background-color: ${props.theme.chatWidgetTheme?.colors?.primary};
    color: white;
  `
      : `
    margin-right: 0.75rem;
    color: rgb(55, 65, 81);
  `}
`;

interface ChatMessageProps {
  message: IMessage;
  userId?: string;
  isTyping?: boolean;
  formIsPresent?: boolean;
  isLastMessage?: boolean;
  isStreamedMessage?: boolean;
}

const mutateFormConfig = (
  formConfig: FormConfig,
  handleSendMessage: (message: string) => void
) => {
  return {
    ...formConfig,
    buttons: formConfig?.buttons?.map((button: FormButton) => ({
      ...button,
      text: button.text.trim(),
      onClick: () => {
        handleSendMessage(button.text);
      },
    })),
    options: formConfig?.options?.map((option: OptionCardType) => ({
      ...option,
      onClick: () => {
        handleSendMessage(option.name);
      },
    })),
    onSubmit: (formattedMessage: string) => {
      handleSendMessage(`${formattedMessage}`);
    },
  };
};

const ChatMessage: FC<ChatMessageProps> = ({
  message,
  isLastMessage = false,
}) => {
  const { handleSendMessage } = useChat();
  const theme = useTheme();
  const messageRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === "user";

  if (message.role === "form" && isLastMessage) {
    return (
      <FormBuilder
        loading={message.loading}
        formConfig={mutateFormConfig(
          message.content as FormConfig,
          handleSendMessage
        )}
      />
    );
  }

  if (message.role === "form") return null;

  return (
    <MessageContainer isUser={isUser} ref={messageRef}>
      {!isUser && <Avatar />}
      <MessageBubble
        className={clsx("p-2 flex-grow w-full", {
          "bg-gray-100 dark:bg-gray-700 text-white": isUser,
          "bg-transparent dark:text-white": !isUser,
        })}
        isUser={isUser}
      >
        <RenderMarkdown
          message={(message.content as string) || ""}
          isUser={isUser}
          theme={theme}
          isStreamedMessage={
            message.role === MessageRole.ASSISTANT && message.loading
          }
        />
      </MessageBubble>
    </MessageContainer>
  );
};

export default ChatMessage;
