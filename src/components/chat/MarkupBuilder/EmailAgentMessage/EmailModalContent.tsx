import { ChatMessage } from "@/types/chat";
import { useChat } from "@/contexts/chat";
import clsx from "clsx";
import { LucideProps } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NormalizedEmailResponse } from "@/types/emailAgentMessage";
import { useLocation } from "react-router-dom";
import { LabelAndValue } from "./LabelAndValue";
import { EmailContent, TYPES } from "./EmailContent";
import { Divider } from "@/components/ui/divider";

interface EmailModalContentProps {
  message: ChatMessage;
  statusText: string;
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
}

const EmailModalContent = ({
  message,
  statusText,
  Icon,
}: EmailModalContentProps) => {
  const { summary } = message.metadata;
  const { email_received, email_drafted, email_sent, reasoning } =
    message.content as unknown as NormalizedEmailResponse;
  const location = useLocation();
  const messageId = location.search.split("message_id=")[1];
  const [isHighlighted, setIsHighlighted] = useState(false);
  const { handleUpdateMessage } = useChat();

  const onUpdateContentPath = useCallback(
    (path: string, value: string | object) => {
      let status = email_drafted ? "draft" : "received";
      if (email_sent) {
        status = "sent";
      }

      handleUpdateMessage({
        id: message.id,
        content: {
          ...message.content,
          [path]: value,
        },
        role: message.role,
        metadata: { ...message.metadata, status },
        tenant_id: message.tenant_id,
      });
    },
    [message, handleUpdateMessage, email_drafted, email_sent]
  );

  const onUpdateDraftEmail = useCallback(
    (newValue) => {
      onUpdateContentPath("email_drafted", {
        to: email_drafted?.to,
        body: newValue?.body,
      });
    },
    [onUpdateContentPath, email_drafted]
  );

  useEffect(() => {
    if (messageId === message.id) {
      setTimeout(() => {
        setIsHighlighted(true);
      }, 200);
    }

    setTimeout(() => {
      setIsHighlighted(false);
    }, 1500);
  }, []);

  return (
    <div
      className={clsx(" w-full transition-all !max-w-[100%]", {
        "scale-[1.04]": isHighlighted,
      })}
    >
      <div className={clsx("flex flex-col gap-3  relative min-h-20")}>
        <LabelAndValue label="Summary" value={summary as string} isMarkdown />
        <LabelAndValue isMarkdown label="Message context" value={reasoning} />

        <EmailContent
          type={TYPES.RECEIVED}
          from={email_received?.from}
          to={email_received?.to}
          subject={email_received?.subject}
          body={email_received?.latest_message.body}
          thread={email_received?.thread}
        />
        {email_drafted && (
          <>
            <EmailContent
              type={TYPES.DRAFT}
              editable
              header={
                <p className="text-muted-foreground text-xs">(click to edit)</p>
              }
              to={email_drafted?.to}
              body={email_drafted?.body}
              onEditBody={onUpdateDraftEmail}
            />
          </>
        )}
        {email_sent && (
          <>
            <EmailContent
              type={TYPES.SENT}
              to={email_sent?.to}
              body={email_sent?.body}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EmailModalContent;
