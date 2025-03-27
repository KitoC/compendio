import { ChatMessage } from "@/types/chat";
import { FormBuilder, FormBuilderConfig } from "./FormBuilder";
import QuickReplyBuilder, { QuickReplyConfig } from "./QuickReplyBuilder";
import { OptionsBuilder, OptionsBuilderConfig } from "./OptionsBuilder";
import EmailAgentMessage from "./EmailAgentMessage";
export interface MarkupbuilderProps {
  message: ChatMessage;
}

export const MARKUP_BUILDER_MAP_ROLES = [
  "form",
  "options",
  "quick-reply",
  "email_agent",
];

const MarkupBuilder = ({ message }: MarkupbuilderProps) => {
  const content = message.content as unknown;

  if (!content) {
    return null;
  }

  if (message.role === "form") {
    return <FormBuilder config={content as FormBuilderConfig} />;
  }
  if (message.role === "options") {
    return <OptionsBuilder config={content as OptionsBuilderConfig} />;
  }

  if (message.role === "quick-reply") {
    return (
      <QuickReplyBuilder
        config={message.content as unknown as QuickReplyConfig}
      />
    );
  }

  if (message.role === "email_agent") {
    return <EmailAgentMessage message={message} />;
  }

  return <div>{message.content.text}</div>;
};

export default MarkupBuilder;
