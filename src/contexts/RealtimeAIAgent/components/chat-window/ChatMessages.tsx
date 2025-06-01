import React from "react";
import { useRealtimeAiAgent } from "../../RealtimAiAgentContext";
import ChatBubble from "./ChatBubble";
import ErrorMessage from "./ErrorMessage";

interface ChatMessagesProps {
  isOpen: boolean;
}

const ChatMessages = ({ isOpen }: ChatMessagesProps) => {
  const { messages, error } = useRealtimeAiAgent();

  return (
    <div
      className={`flex-1 overflow-y-auto ${
        isOpen ? "bg-slate-100" : "bg-transparent"
      }`}
    >
      <div className="p-4">
        {error ? (
          <ErrorMessage />
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message) => (
              <ChatBubble
                key={message.content}
                message={message}
                scrollOnMount={false}
              >
                {message.content}
              </ChatBubble>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;
