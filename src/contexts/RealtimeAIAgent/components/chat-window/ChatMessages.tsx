import { cn } from "@/lib/utils";
import { useRealtimeAiAgent } from "../../RealtimAiAgentContext";
import ChatBubble from "./ChatBubble";

const ChatMessages = ({ isOpen }: { isOpen: boolean }) => {
  const { messages, currentInteraction } = useRealtimeAiAgent();

  return (
    <div className={cn("flex-1 overflow-y-auto", isOpen && "bg-slate-100/50")}>
      <div className="p-2">
        <div className="flex flex-col gap-2">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              scrollOnMount={false}
            />
          ))}
          {currentInteraction.user.content && (
            <ChatBubble
              message={currentInteraction.user}
              scrollOnMount={false}
            />
          )}
          {currentInteraction.assistant.content && (
            <ChatBubble
              scrollOnMount={true}
              message={currentInteraction.assistant}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessages;
