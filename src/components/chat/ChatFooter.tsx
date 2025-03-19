// NO_CHANGE

import "regenerator-runtime/runtime"; // Import regenerator runtime for Safari compatibility
import "core-js/stable";
import { useChat } from "@/contexts/chat";
import ChatInput from "./ChatInput";

const ChatFooter = () => {
  const { isTyping, inputRef, handleSendMessage, conversationId } = useChat();

  return (
    <div className="z-10">
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
