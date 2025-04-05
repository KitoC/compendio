import { ChatMessage } from "@/types/chat";
import { NormalizedEmailThreadItem } from "@/types/emailAgentMessage";

export interface QuickReplyBuilderProps {
  message: ChatMessage;
}

export interface EmailContentProps {
  from?: string;
  to: string;
  subject?: string;
  body: string;
  header: string;
  thread?: NormalizedEmailThreadItem[];
  editable?: boolean;
  onEditBody?: (newValue: { body: string }) => void;
}
