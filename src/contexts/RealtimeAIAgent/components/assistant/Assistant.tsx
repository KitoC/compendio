import React, { useState, useCallback } from "react";
import ChatWindow from "../chat-window/ChatWindow";
import AssistantAvatar from "./AssistantAvatar";

const Assistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <div className="absolute bottom-0 right-0">
      <div className="p-8">
        <ChatWindow isOpen={isOpen} toggleOpen={toggleOpen}>
          <AssistantAvatar toggleOpen={toggleOpen} isOpen={isOpen} />
        </ChatWindow>
      </div>
    </div>
  );
};

export default Assistant;
