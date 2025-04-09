// NO_CHANGE

import { useChat } from "@/contexts/chat";
import ChatMessage from "./ChatMessage";
import Loader from "../ui/loader";
import clsx from "clsx";
import { useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationProvider";
import { Virtuoso } from "react-virtuoso";
import dayjs from "dayjs";

const ChatMessages = () => {
  const { messages, isLoading, virtuosoProps } = useChat();
  const { setEmailCount, emailCount } = useNotifications();

  // useEffect(() => {
  //   const draftEmailsPresent = messages.filter(
  //     (message) => message.metadata?.status === "draft"
  //   );

  //   if (draftEmailsPresent.length !== emailCount) {
  //     setEmailCount(draftEmailsPresent.length);
  //   }
  // }, [messages, setEmailCount, emailCount]);

  return (
    <div className={clsx("h-full px-4 py-6 pb-0 scroll-smooth space-y-4")}>
      {isLoading || virtuosoProps.firstItemIndex === null ? (
        <div className="flex justify-center items-center h-full">
          <Loader size="large" />
        </div>
      ) : messages.length > 0 ? (
        <Virtuoso
          {...virtuosoProps}
          itemContent={(index, message) => {
            const isLastMessage = index === messages.length - 1;
            const functionalMessages = messages.filter((fm) => {
              const hasResponse = messages.find((m) => m.reply_to === fm.id);

              const isFunctionalMessage = fm.reply_to === message.id.toString();

              return isFunctionalMessage && !hasResponse;
            });

            return (
              <div
                key={message.id}
                id={message.id}
                data-user-message={message.role === "user" ? "true" : "false"}
                className={clsx("animate-fadeIn w-full")}
              >
                <div className="py-2 pl-3 text-xs text-muted-foreground">
                  {dayjs(message.created_at).format("DD MMMM, hh:mm a")}
                </div>
                <ChatMessage
                  message={message}
                  isLastMessage={isLastMessage}
                  functionalMessages={functionalMessages}
                />
              </div>
            );
          }}
          style={{ height: "100%", overflowY: "auto" }}
        />
      ) : (
        <div className="flex justify-center items-center h-full">
          <p className="text-muted-foreground">No messages found</p>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;
