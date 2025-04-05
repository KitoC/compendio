// NO_CHANGE

import { useChat } from "@/contexts/chat";
import ChatMessage from "./ChatMessage";
import { MARKUP_BUILDER_MAP_ROLES } from "./MarkupBuilder";
import Loader from "../ui/loader";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import { useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationProvider";

const ChatMessages = () => {
  const { messages, messagesContainerRef, messagesLoaded } = useChat();
  const { setEmailCount, emailCount } = useNotifications();

  const filteredMessages = messages
    .filter((message) =>
      ["user", "assistant", ...MARKUP_BUILDER_MAP_ROLES].includes(message.role)
    )
    .filter((fm) => !fm.reply_to);

  useEffect(() => {
    const draftEmailsPresent = messages.filter(
      (message) => message.metadata?.status === "draft"
    );

    if (draftEmailsPresent.length !== emailCount) {
      setEmailCount(draftEmailsPresent.length);
    }
  }, [messages, setEmailCount, emailCount]);

  return (
    <div
      className="flex-1 px-4 py-6 overflow-y-auto scroll-smooth space-y-4"
      ref={messagesContainerRef}
    >
      {!messagesLoaded && (
        <div className="flex justify-center items-center h-full">
          <Loader size="large" />
        </div>
      )}
      {filteredMessages.map((message, index) => {
        const isLastMessage = index === filteredMessages.length - 1;
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
            className={clsx("animate-fadeIn")}
          >
            <ChatMessage
              message={message}
              isLastMessage={isLastMessage}
              functionalMessages={functionalMessages}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessages;
