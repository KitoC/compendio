
import { FC, useRef } from "react";
import { useChat } from "@/contexts/chat";
import { IMessage, MessageRole } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import clsx from "clsx";
import RenderMarkdown from "./RenderMarkdown";

interface ChatMessageProps {
  message: IMessage;
  isLastMessage?: boolean;
}

const ChatMessage: FC<ChatMessageProps> = ({
  message,
  isLastMessage = false,
}) => {
  const { handleSendMessage, isTyping } = useChat();
  const messageRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === "user";
  const isTypeIndicator = message.role === MessageRole.ASSISTANT && message.loading && isLastMessage && isTyping;

  return (
    <div
      className={clsx("flex mb-4 w-fit", {
        "flex-row-reverse ml-auto": isUser,
        "flex-row": !isUser,
      })}
      ref={messageRef}
    >
      <div
        className={clsx("px-3 py-[3px] flex-grow w-full rounded-lg", {
          "bg-primary text-primary-foreground": isUser,
          "bg-muted dark:transparent dark:text-white": !isUser,
        })}
      >
        {isTypeIndicator ? (
          <div className="flex items-center h-6">
            <span className="dot-typing"></span>
          </div>
        ) : (
          <RenderMarkdown
            message={(message.content as string) || ""}
            isUser={isUser}
            isStreamedMessage={
              message.role === MessageRole.ASSISTANT && message.loading
            }
          />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
