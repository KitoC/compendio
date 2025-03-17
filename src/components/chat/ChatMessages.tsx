
import { useChat } from "@/contexts/chat";
import ChatMessage from "./ChatMessage";
import { Skeleton } from "@/components/ui/skeleton";

const ChatMessages = () => {
  const { messages, messagesContainerRef, isLoading } = useChat();

  const filteredMessages = messages.filter(
    (message) => message.role !== "system"
  );

  if (isLoading) {
    return (
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="space-y-4">
          <div className="flex">
            <Skeleton className="h-12 w-2/3 rounded-lg" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-1/2 rounded-lg" />
          </div>
          <div className="flex">
            <Skeleton className="h-16 w-3/4 rounded-lg" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-2/3 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

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
            <ChatMessage message={message} isLastMessage={isLastMessage} />
          </div>
        );
      })}
    </div>
  );
};

export default ChatMessages;
