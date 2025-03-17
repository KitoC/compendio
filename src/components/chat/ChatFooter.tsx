
import "regenerator-runtime/runtime"; // Import regenerator runtime for Safari compatibility
import "core-js/stable";
import { useChat } from "@/contexts/chat";
import ChatInput from "./ChatInput";

const ChatFooter = () => {
  const { messages, isTyping, inputRef, handleSendMessage, agentId } = useChat();

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="p-2 z-10">
      <ChatInput
        ref={inputRef}
        onSendMessage={handleSendMessage}
        disabled={isTyping}
        agentId={agentId}
      />
    </div>
  );
};

ChatFooter.displayName = "ChatFooter";

export default ChatFooter;
