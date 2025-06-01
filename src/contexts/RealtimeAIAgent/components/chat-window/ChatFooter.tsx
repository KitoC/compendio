import React from "react";
import MicrophoneToggle from "../controls/MicrophoneToggle";
import ChatInput from "./ChatInput";

/**
 * Chat footer component that contains the microphone toggle and chat input
 */
const ChatFooter = () => {
  return (
    <div className="mt-auto w-full p-4 bg-slate-100 rounded-b-lg">
      <div className="flex items-end gap-4">
        <MicrophoneToggle />
        <ChatInput />
      </div>
    </div>
  );
};

export default ChatFooter;
