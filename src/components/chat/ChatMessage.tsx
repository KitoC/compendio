
import { FC, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { IMessage, MessageRole, FormConfig } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import clsx from "clsx";
import { FormBuilder } from "./FormBuilder";
import RenderMarkdown from "./RenderMarkdown";

interface ChatMessageProps {
  message: IMessage;
  isLastMessage?: boolean;
}

const mutateFormConfig = (
  formConfig: FormConfig,
  handleSendMessage: (message: string) => void
) => {
  return {
    ...formConfig,
    buttons: formConfig?.buttons?.map((button) => ({
      ...button,
      text: button.text.trim(),
      onClick: () => {
        handleSendMessage(button.text);
      },
    })),
    options: formConfig?.options?.map((option) => ({
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
    <div 
      className={clsx("flex mb-4 w-fit", {
        "flex-row-reverse ml-auto": isUser,
        "flex-row": !isUser,
      })}
      ref={messageRef}
    >
      {!isUser && (
        <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
          <AvatarImage src="/placeholder.svg" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={clsx("p-2 flex-grow w-full rounded-lg", {
          "bg-primary text-primary-foreground": isUser,
          "bg-muted dark:bg-gray-700 dark:text-white": !isUser,
        })}
      >
        <RenderMarkdown
          message={(message.content as string) || ""}
          isUser={isUser}
          isStreamedMessage={
            message.role === MessageRole.ASSISTANT && message.loading
          }
        />
      </div>
    </div>
  );
};

export default ChatMessage;
