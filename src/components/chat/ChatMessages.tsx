
import { useChat } from "@/hooks/useChat";
import ChatMessage from "./ChatMessage";

const ChatMessages = () => {
  const { messages, messagesContainerRef } = useChat();

  const filteredMessages = messages.filter(
    (message) => message.role !== "system"
  );

  return (
    <div 
      className="flex-1 p-4 overflow-y-auto scroll-smooth space-y-4"
      ref={messagesContainerRef}
    >
      {filteredMessages.map((message, index) => {
        const isLastMessage = index === filteredMessages.length - 1;

        return (
          <div
            key={message.id}
            data-user-message={message.role === "user" ? "true" : "false"}
            className="animate-fadeIn"
          >
            <ChatMessage
              message={message}
              isLastMessage={isLastMessage}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessages;
