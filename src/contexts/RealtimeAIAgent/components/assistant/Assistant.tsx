import ChatWindow from "../chat-window/ChatWindow";
import { AssistantAvatar } from "./AssistantAvatar";
import { useState, useCallback } from "react";

export const Assistant = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = useCallback((isOpen: boolean) => setIsOpen(isOpen), []);

  return (
    <div className="absolute bottom-0 right-0">
      <div className="p-8 pointer-events-auto">
        <ChatWindow isOpen={isOpen} toggleOpen={toggleOpen}>
          <AssistantAvatar toggleOpen={toggleOpen} isOpen={isOpen} />
        </ChatWindow>
      </div>
    </div>
  );
};
