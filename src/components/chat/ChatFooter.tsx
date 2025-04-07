// NO_CHANGE

import "regenerator-runtime/runtime"; // Import regenerator runtime for Safari compatibility
import "core-js/stable";
import { useChat } from "@/contexts/chat";
import ChatInput from "./ChatInput";
import { useIsMobile } from "@/hooks/use-mobile";
import clsx from "clsx";

const ChatFooter = () => {
  const { isTyping, inputRef, handleSendMessage, conversationId } = useChat();
  const isMobile = useIsMobile();

  return (
    <div className={clsx("z-10", isMobile && "fixed bottom-0 left-0 right-0")}>
      <ChatInput
        ref={inputRef}
        onSendMessage={handleSendMessage}
        disabled={isTyping}
        conversationId={conversationId}
      />
    </div>
  );
};

ChatFooter.displayName = "ChatFooter";

export default ChatFooter;
