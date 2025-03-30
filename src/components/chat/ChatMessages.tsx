// NO_CHANGE

import { useChat } from "@/contexts/chat";
import ChatMessage from "./ChatMessage";
import { MARKUP_BUILDER_MAP_ROLES } from "./MarkupBuilder";

const ChatMessages = () => {
  const { messages, messagesContainerRef } = useChat();

  const filteredMessages = messages
    .filter((message) =>
      ["user", "assistant", ...MARKUP_BUILDER_MAP_ROLES].includes(message.role)
    )
    .filter((fm) => !fm.reply_to);

  console.log("filteredMessages", filteredMessages);
  console.log("messages", messages);
  return (
    <div
      className="flex-1 px-4 py-6 overflow-y-auto scroll-smooth space-y-4"
      ref={messagesContainerRef}
    >
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
            data-user-message={message.role === "user" ? "true" : "false"}
            className="animate-fadeIn"
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
