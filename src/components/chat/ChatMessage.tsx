import { FC, useRef } from "react";
import { ChatMessage as ChatMessageType, MessageRole } from "@/types/chat";
import clsx from "clsx";
import RenderMarkdown from "./RenderMarkdown";
import MarkupBuilder from "./MarkupBuilder";

interface ChatMessageProps {
  message: ChatMessageType;
  isLastMessage?: boolean;
  functionalMessages: ChatMessageType[];
}

const ChatMessage: FC<ChatMessageProps> = ({ message, functionalMessages }) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === "user";

  console.log({ functionalMessages });

  return (
    <>
      <div
        className={clsx("flex flex-col gap-2 mb-4 w-fit", {
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
          <RenderMarkdown
            message={message.content.text || ""}
            isUser={isUser}
            isStreamedMessage={
              message.role === MessageRole.ASSISTANT && message.loading
            }
          />
        </div>
        {functionalMessages.map((fm) => (
          <div
            key={fm.id}
            className={clsx("p-3 flex-grow w-full rounded-lg", {
              "bg-primary text-primary-foreground": isUser,
              "bg-muted dark:transparent dark:text-white": !isUser,
            })}
          >
            <MarkupBuilder message={fm} />
          </div>
        ))}
      </div>
    </>
  );
};

export default ChatMessage;
