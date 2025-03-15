
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
  const { handleSendMessage } = useChat();
  const messageRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === "user";

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
