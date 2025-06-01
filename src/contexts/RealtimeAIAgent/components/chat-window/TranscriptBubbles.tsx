import React from "react";
import { useRealtimeAiAgent } from "../../RealtimAiAgentContext";
import ChatBubble from "./ChatBubble";
import ErrorMessage from "./ErrorMessage";

interface TranscriptBubblesProps {
  isOpen: boolean;
}

const TranscriptBubbles = ({ isOpen }: TranscriptBubblesProps) => {
  const { messages, error } = useRealtimeAiAgent();

  const lastTwoMessages = messages.slice(-2);

  if (isOpen) {
    return null;
  }

  const containerClasses = `
    flex flex-col -right-4 transition-all duration-300 
    border border-transparent rounded-md h-fit w-80 
    -top-15 gap-2 p-2
    ${isOpen ? "opacity-0 h-0" : ""}
  `;

  if (error) {
    return (
      <div className={containerClasses}>
        <ChatBubble
          message={{ role: "error", content: "" }}
          scrollOnMount={false}
        >
          <ErrorMessage />
        </ChatBubble>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {lastTwoMessages.map((message, index) => (
        <ChatBubble
          key={`${message.role}-${index}`}
          message={message}
          scrollOnMount={false}
        >
          {message.content}
        </ChatBubble>
      ))}
    </div>
  );
};

export default TranscriptBubbles;
