
import { useChat } from "@/hooks/useChat";
import ChatInput from "./ChatInput";
import { FormConfig } from "@/types/chat";

const ChatFooter = () => {
  const { messages, isTyping, inputRef, handleSendMessage } = useChat();

  const lastMessage = messages[messages.length - 1];
  const formConfig = lastMessage?.content as FormConfig;

  if (lastMessage?.role === "form" && formConfig?.hideChatInput) {
    return null;
  }

  return (
    <div className="dark:bg-gray-800 p-2 z-10">
      <ChatInput
        ref={inputRef}
        onSendMessage={handleSendMessage}
        disabled={isTyping || formConfig?.disableChatInput}
      />
    </div>
  );
};

export default ChatFooter;
