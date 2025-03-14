import ChatInput from "./ChatInput";
import styled from "styled-components";
import { useChat } from "../../contexts/chat/context";
import { FormConfig } from "../form-builder/types";

const InputWrapper = styled.div`
  z-index: 100;
  overflow: hidden;
`;

const ChatFooter = () => {
  const { messages, isTyping, inputRef, handleSendMessage } = useChat();

  const lastMessage = messages[messages.length - 1];
  const formConfig = lastMessage?.content as FormConfig;

  if (lastMessage?.role === "form" && formConfig?.hideChatInput) {
    return null;
  }

  return (
    <InputWrapper className="dark:bg-gray-800 p-2">
      <ChatInput
        ref={inputRef}
        onSendMessage={handleSendMessage}
        disabled={isTyping || formConfig?.disableChatInput}
      />
    </InputWrapper>
  );
};

export default ChatFooter;
