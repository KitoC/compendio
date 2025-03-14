import ChatMessage from "./ChatMessage";
import styled, { keyframes } from "styled-components";
import { useChat } from "../../contexts/chat/context";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  scroll-behavior: smooth;

  & > * + * {
    margin-top: 1rem;
  }
`;

const MessageWrapper = styled.div`
  animation: ${fadeIn} 0.3s ease-in;
`;

const ChatMessages = () => {
  const { messages, userId, messagesContainerRef } = useChat();

  const filteredMessages = messages.filter(
    (message) => message.role !== "system"
  );

  return (
    <MessagesContainer ref={messagesContainerRef}>
      {filteredMessages.map((message, index) => {
        const isLastMessage = index === filteredMessages.length - 1;

        return (
          <MessageWrapper
            key={message.id}
            data-user-message={message.role === "user" ? "true" : "false"}
          >
            <ChatMessage
              message={message}
              userId={userId}
              isTyping={false}
              isLastMessage={isLastMessage}
            />
          </MessageWrapper>
        );
      })}
    </MessagesContainer>
  );
};

export default ChatMessages;
