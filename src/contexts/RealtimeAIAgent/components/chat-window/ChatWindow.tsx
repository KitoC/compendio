import React from "react";
import { X } from "lucide-react";
import ChatMessages from "./ChatMessages";
import ChatFooter from "./ChatFooter";
import TranscriptBubbles from "./TranscriptBubbles";

interface ChatWindowProps {
  children: React.ReactNode;
  isOpen: boolean;
  toggleOpen: (open: boolean) => void;
}

const ChatWindow = ({ children, isOpen, toggleOpen }: ChatWindowProps) => {
  return (
    <div
      className={`
        relative pointer-events-auto 
        ${isOpen ? "rounded-lg p-0.5 bg-lime-600" : "rounded-full"}
      `}
    >
      <TranscriptBubbles isOpen={isOpen} />
      <div
        className={`
          ${isOpen ? "absolute top-3 left-3" : ""}
        `}
      >
        {children}
      </div>
      <div
        className={`
          flex flex-col transition-all duration-300 rounded-lg
          ${isOpen ? "h-[500px] w-[400px] opacity-100" : "h-0 w-0 opacity-0"}
        `}
      >
        {isOpen && (
          <div className="flex items-start justify-between p-4 h-[100px] bg-stone-600 rounded-lg rounded-b-none">
            <div className="ml-auto">
              <button
                type="button"
                className="p-1.5 px-2 bg-white/20 border-none rounded hover:bg-white/30 transition-colors"
                onClick={() => toggleOpen(!isOpen)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <ChatMessages isOpen={isOpen} />
        {isOpen && <ChatFooter />}
      </div>
    </div>
  );
};

export default ChatWindow;
