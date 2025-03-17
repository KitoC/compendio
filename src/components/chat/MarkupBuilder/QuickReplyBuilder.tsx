import { Button } from "../../ui/button";
import { useChat } from "@/contexts/chat";

export interface QuickReplyConfig {
  replies: string[];
  isInline: boolean;
}

interface QuickReplyBuilderProps {
  config: QuickReplyConfig;
}

const QuickReplyBuilder = ({ config }: QuickReplyBuilderProps) => {
  const { replies = [], isInline } = config;

  const { handleSendMessage } = useChat();

  return (
    <div>
      <div className={`flex ${isInline ? "flex-row" : "flex-col"} gap-2`}>
        {replies.map((reply) => (
          <Button key={reply} onClick={() => handleSendMessage(reply)}>
            {reply}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplyBuilder;
