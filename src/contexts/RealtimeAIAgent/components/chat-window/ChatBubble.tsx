import RenderMarkdown from "@/components/chat/RenderMarkdown";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const ChatBubble = ({ message, scrollOnMount }) => {
  const isUser = message.role === "user";
  const bubbleRef = useRef(null);

  useEffect(() => {
    if (scrollOnMount) {
      bubbleRef.current.scrollTop = bubbleRef.current.scrollHeight;
    }
  }, [scrollOnMount]);

  return (
    <div className="w-full" ref={bubbleRef}>
      <div
        className={cn(
          "w-fit max-w-[90%] bg-white rounded-lg p-2 shadow-sm border border-border",
          isUser && "ml-auto"
        )}
      >
        <RenderMarkdown message={message.content} isUser={isUser} />
      </div>
    </div>
  );
};

export default ChatBubble;
