import { FC, useRef } from "react";
import { ChatMessage as ChatMessageType, MessageRole } from "@/types/chat";
import { NormalChatContent } from "@/types/chat";
import clsx from "clsx";
import RenderMarkdown from "./RenderMarkdown";
import MarkupBuilder, { MARKUP_BUILDER_MAP_ROLES } from "./MarkupBuilder";
import { getContainerStyles, getMessageBubbleStyles } from "./shared.styles";
import Loader from "../ui/loader";

interface ChatMessageProps {
  message: ChatMessageType;
  isLastMessage?: boolean;
  functionalMessages: ChatMessageType[];
}

const ChatMessage: FC<ChatMessageProps> = ({ message, functionalMessages }) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === "user";

  if (MARKUP_BUILDER_MAP_ROLES.includes(message.role)) {
    return <MarkupBuilder message={message} />;
  }

  if (!message.content?.text) {
    return <Loader />;
  }

  return (
    <>
      <div className={getContainerStyles({ isUser })} ref={messageRef}>
        <div className={getMessageBubbleStyles({ isUser, functionalMessages })}>
          <RenderMarkdown
            message={(message.content as NormalChatContent).text || ""}
            isUser={isUser}
            isStreamedMessage={
              message.role === MessageRole.ASSISTANT && message.loading
            }
          />
        </div>
        {functionalMessages.map((fm) => (
          <div
            key={fm.id}
            className={clsx(
              "p-3 flex-grow w-full rounded-lg border rounded-t-none",
              {
                "bg-primary text-primary-foreground": isUser,
                "bg-muted dark:transparent dark:text-white dark:border-slate-700":
                  !isUser,
              }
            )}
          >
            <MarkupBuilder message={fm} />
          </div>
        ))}
      </div>
    </>
  );
};

export default ChatMessage;
