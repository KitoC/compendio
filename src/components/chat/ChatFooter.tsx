// NO_CHANGE

import "regenerator-runtime/runtime"; // Import regenerator runtime for Safari compatibility
import "core-js/stable";
import { useChat } from "@/contexts/chat";
import ChatInput from "./ChatInput";
import { useIsMobile } from "@/hooks/use-mobile";
import clsx from "clsx";
import { IAiAgent } from "@/types/aiAgents";
import { useAiAgents } from "@/contexts/AiAgents";
import { EmailAssistantToolbar } from "./Toolbars/EmailAssistantToolbar";

const getAgentToolbar = (agent: IAiAgent) => {
  switch (agent?.name) {
    case "email-assistant":
      return <EmailAssistantToolbar />;
    default:
      return null;
  }
};

const ChatFooter = () => {
  const { isTyping, inputRef, handleSendMessage, conversationId } = useChat();
  const isMobile = useIsMobile();
  const { currentAgent } = useAiAgents();

  return (
    <div className={clsx("z-10", isMobile && "fixed bottom-0 left-0 right-0")}>
      <div className="relative">
        <div className="absolute bottom-0 left-0 right-0">
          {getAgentToolbar(currentAgent)}
        </div>
      </div>

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
