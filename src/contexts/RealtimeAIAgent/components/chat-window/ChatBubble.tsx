import React, { useEffect, useRef } from "react";

interface Message {
  role: string;
  content: string;
}

interface ChatBubbleProps {
  message: Message;
  scrollOnMount: boolean;
  children: React.ReactNode;
}

const ChatBubble = ({ message, scrollOnMount, children }: ChatBubbleProps) => {
  const isUser = message?.role === "user";
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollOnMount && bubbleRef.current) {
      bubbleRef.current.scrollTop = bubbleRef.current.scrollHeight;
    }
  }, [scrollOnMount]);

  return (
    <div ref={bubbleRef} className="w-full">
      <div
        className={`
          w-fit max-w-[90%] bg-white rounded-lg p-2 
          shadow-sm border border-gray-300
          ${isUser ? "ml-auto" : "ml-0"}
        `}
      >
        {children}
      </div>
    </div>
  );
};

export default ChatBubble;
