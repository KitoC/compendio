import { ChatMessage } from "@/types/chat";
import { Button, ButtonProps } from "../../ui/button";
import { useChat } from "@/contexts/chat";
import {
  getContainerStyles,
  messageBubbleStyles,
  otherMessageStyles,
} from "../shared.styles";
import clsx from "clsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FoldVertical, UnfoldVertical } from "lucide-react";
import { useState } from "react";
import RenderMarkdown from "../RenderMarkdown";
import {
  NormalizedEmailResponse,
  NormalizedEmailThreadItem,
} from "@/types/emailAgentMessage";

export interface QuickReplyConfig {
  replies: string[];
  isInline: boolean;
}

interface QuickReplyBuilderProps {
  message: ChatMessage;
}

interface EmailContentProps {
  from?: string;
  to: string;
  subject?: string;
  body: string;
  header: string;
  thread?: NormalizedEmailThreadItem[];
}

const EmailContent = ({
  from,
  to,
  subject,
  body,
  header,
  thread,
}: EmailContentProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-bold">{header}</h3>
      </div>
      {from && (
        <p className="text-sm text-muted-foreground">
          <strong>From: </strong>
          {from}
        </p>
      )}
      {to && (
        <p className="text-sm text-muted-foreground">
          <strong>To: </strong>
          {to}
        </p>
      )}
      <div className="pl-6">
        <div className="flex flex-col gap-1">
          {subject && (
            <p>
              <strong>Subject: </strong>
              {subject}
            </p>
          )}

          {body && (
            <div className="mt-1">
              <RenderMarkdown message={body} isUser={false} />
            </div>
          )}
          {!!thread?.length && (
            <div className="mt-1">
              <p>Thread:</p>
              {thread.map(({ from, timestamp, body }) => (
                <div className="mt-1">
                  <div className="border-t border-slate-700 w-full my-2"></div>
                  <p className="text-xs text-muted-foreground">
                    {from} - {new Date(timestamp).toLocaleDateString()}
                  </p>
                  <RenderMarkdown message={body} isUser={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickReplyBuilder = ({ message }: QuickReplyBuilderProps) => {
  const { email_received, email_drafted, reasoning } =
    message.content as unknown as NormalizedEmailResponse;

  const [open, setOpen] = useState(true);

  const { handleSendMessage } = useChat();

  const onClick = (label: string) => {
    if (label === "Discard") {
      // handleSendMessage("discard");
    } else if (label === "Edit") {
      // handleSendMessage("edit");
    }
  };

  const buttons: { label: string; variant: ButtonProps["variant"] }[] = [
    {
      label: "Discard",
      variant: "outline-destructive",
    },
    {
      label: "Edit",
      variant: "outline-primary",
    },
    {
      label: "Send",
      variant: "outline-primary",
    },
  ];

  return (
    <div className={getContainerStyles({ isUser: false }) + " w-full"}>
      <div
        className={clsx(
          messageBubbleStyles,
          otherMessageStyles,
          "flex flex-col gap-3 !py-4 rounded-b-none relative min-h-20"
        )}
      >
        <Collapsible
          className="w-full"
          open={open}
          onOpenChange={() => {
            setOpen(!open);
          }}
        >
          <div className="p-4 absolute top-0 right-0">
            <CollapsibleTrigger>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(!open)}
              >
                {open ? <UnfoldVertical /> : <FoldVertical />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <EmailContent
              header="They sent:"
              from={email_received.from}
              to={email_received.to}
              subject={email_received.subject}
              body={email_received.latest_message.body}
              thread={email_received.thread}
            />
            {email_drafted && (
              <>
                <div className="border-t border-slate-700 w-full my-2"></div>
                <EmailContent
                  header="I drafted this reply:"
                  to={email_drafted.to}
                  body={email_drafted.body}
                />
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
      <div
        className={clsx(
          messageBubbleStyles,
          otherMessageStyles,
          "flex flex-col gap-3 !py-4 rounded-t-none"
        )}
      >
        <p>{reasoning}</p>
        <p>What would you like me to do?</p>
      </div>
      <div className={`flex gap-2 justify-end mt-2`}>
        {buttons.map(({ label, variant }) => (
          <Button
            key={label}
            size="sm"
            onClick={() => onClick(label)}
            variant={variant}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickReplyBuilder;
