import React from "react";
import "../styles/main.css";
import styled from "styled-components";
import ChatMessages from "../components/chat/ChatMessages";
import ChatFooter from "../components/chat/ChatFooter";

import clsx from "clsx";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ChatPage: React.FC = () => {
  return (
    <Container
      className={clsx(
        "bg-white dark:bg-gray-800 rounded-lg p flex flex-col items-center"
      )}
    >
      <div className="dark:bg-gray-700 w-full h-12"></div>

      <div className="flex flex-col h-full w-3/6 pb-4">
        <ChatMessages />
        <ChatFooter />
      </div>
    </Container>
  );
};

export default ChatPage;
