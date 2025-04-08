import { ChatMessage } from "@/types/chat";
import { Button, ButtonProps } from "../../../ui/button";
import { useChat } from "@/contexts/chat";
import {
  getContainerStyles,
  messageBubbleStyles,
  otherMessageStyles,
} from "../../shared.styles";
import clsx from "clsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FoldVertical,
  Mail,
  MailCheck,
  MailPlus,
  MailQuestion,
  MailX,
  UnfoldVertical,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import RenderMarkdown from "../../RenderMarkdown";
import {
  NormalizedEmailResponse,
  NormalizedEmailThreadItem,
} from "@/types/emailAgentMessage";
import { toast } from "sonner";

import { useLocation, useNavigate } from "react-router-dom";
import { LabelAndValue } from "./LabelAndValue";
import { EmailContent } from "./EmailContent";
import { Divider } from "@/components/ui/divider";
import dayjs from "dayjs";

interface EmailAgentMessageProps {
  message: ChatMessage;
}

const EmailAgentMessage = ({ message }: EmailAgentMessageProps) => {
  const { summary } = message.metadata;
  const { email_received, email_drafted, email_sent, reasoning } =
    message.content as unknown as NormalizedEmailResponse;

  const location = useLocation();
  const messageId = location.search.split("message_id=")[1];
  const navigate = useNavigate();
  const [open, setOpen] = useState(!!email_drafted);
  const [isSending, setIsSending] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const { triggerFunctionCall, replaceMessage, handleUpdateMessage } =
    useChat();

  const onUpdateContentPath = useCallback(
    (path: string, value: string | object) => {
      let status = email_drafted ? "draft" : "received";
      if (email_sent) {
        status = "sent";
      }

      console.log("onUpdateContentPath", path, value);
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

  const buttons: {
    label: string;
    variant: ButtonProps["variant"];
    onClick: () => void;
    disabled?: boolean;
    visible?: boolean;
  }[] = [
    // {
    //   label: "Ignore",
    //   variant: "outline-destructive",
    //   visible: !!email_drafted,
    //   disabled: isSending,
    //   onClick: () => {
    //     // triggerFunctionCall({
    //     //   type: "email:discard",
    //     //   message_id: message.id,
    //     // });
    //   },
    // },
    {
      label: isSending ? "Sending..." : "Send",
      disabled: isSending,
      variant: "outline-primary",
      visible: !!email_drafted,
      onClick: async () => {
        try {
          setIsSending(true);
          setOpen(false);

          const { result, err } = await triggerFunctionCall({
            manual: true,
            name: "send_email",
            arguments: JSON.stringify({
              message_id: message.id,
            }),
          });

          if (err) {
            setIsSending(false);
            toast.error("Error sending email");
          } else {
            setIsSending(false);
            toast.success("Email sent successfully");
            replaceMessage(result as ChatMessage);
          }
        } catch (err) {
          console.error("Error sending email", err);
          setIsSending(false);
          toast.error("Error sending email");
        }
      },
    },
  ];

  let statusText = "";

  if (email_sent) {
    statusText = "Sent";
  } else if (email_drafted) {
    statusText = "Drafted";
  } else if (email_received) {
    statusText = "Received";
  }

  if (isSending) {
    statusText = "Sending...";
  }

  const status = (
    <LabelAndValue
      labelClassName="w-[80px]"
      label="Status"
      value={
        <>
          <span>{statusText}</span>
          {!email_drafted && !email_sent && (
            <span className="text-muted-foreground ml-1 text-xs">
              (No response required)
            </span>
          )}
        </>
      }
    />
  );

  const icon = (
    <>
      {statusText === "Sent" && <MailCheck className="text-primary ml-2" />}
      {statusText === "Drafted" && (
        <MailQuestion className="text-primary ml-2" />
      )}
      {statusText === "Received" && <MailPlus className="text-primary ml-2" />}
      {statusText === "Failed" && <MailX className="text-primary ml-2" />}
      {statusText === "Sending..." && (
        <div className="fit-content">
          <Mail className="text-primary ml-2 email-sending" />
        </div>
      )}
    </>
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
    <Collapsible
      className="w-full"
      open={open}
      onOpenChange={() => {
        setOpen(!open);
      }}
    >
      <div
        className={clsx(
          getContainerStyles({ isUser: false }) +
            " w-full transition-all !max-w-[100%]",
          {
            "scale-[1.04]": isHighlighted,
          }
        )}
      >
        <div
          className={clsx(
            messageBubbleStyles,
            otherMessageStyles,
            "flex flex-col gap-3 !py-4  relative min-h-20",
            {
              "rounded-b-none": open,
            }
          )}
        >
          <div className="flex justify-between">
            {icon}
            <CollapsibleTrigger>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(!open)}
              >
                {open ? <FoldVertical /> : <UnfoldVertical />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <div className="flex flex-col gap-1">
            {status}
            {!open && (
              <>
                {!email_sent && (
                  <LabelAndValue
                    labelClassName="w-[80px]"
                    label="From"
                    valueClassName="text-xs"
                    value={email_received?.from}
                  />
                )}
                <LabelAndValue
                  labelClassName="w-[80px]"
                  valueClassName="text-xs"
                  label="To"
                  value={email_sent?.to}
                />
                <LabelAndValue
                  labelClassName="w-[80px]"
                  label="Subject"
                  value={email_received?.subject}
                />
                <LabelAndValue
                  labelClassName="w-[80px]"
                  label="Summary"
                  value={summary as string}
                  isMarkdown
                />

                {!email_sent && (
                  <LabelAndValue
                    labelClassName="w-[80px]"
                    label="Reasoning"
                    value={reasoning}
                  />
                )}
              </>
            )}
          </div>

          <CollapsibleContent>
            <EmailContent
              header="They sent"
              from={email_received?.from}
              to={email_received?.to}
              subject={email_received?.subject}
              body={email_received?.latest_message.body}
              thread={email_received?.thread}
            />
            {email_drafted && (
              <>
                <Divider />
                <EmailContent
                  editable
                  header="I drafted this reply for you, you can edit it if you want"
                  to={email_drafted?.to}
                  body={email_drafted?.body}
                  onEditBody={onUpdateDraftEmail}
                />
              </>
            )}
            {email_sent && (
              <>
                <Divider />
                <EmailContent
                  header={`I sent this reply`}
                  to={email_sent?.to}
                  body={email_sent?.body}
                />
              </>
            )}
          </CollapsibleContent>
        </div>
        <CollapsibleContent>
          <div
            className={clsx(
              messageBubbleStyles,
              otherMessageStyles,
              "flex flex-col gap-3 !py-4 rounded-t-none"
            )}
          >
            <div>
              <LabelAndValue
                isMarkdown
                label="Reasoning"
                value={reasoning}
                labelClassName="w-[80px]"
              />
            </div>
            {email_drafted && <p>What would you like me to do?</p>}
          </div>

          {!isSending && (
            <div className={`flex gap-2 justify-end mt-2`}>
              {buttons
                .filter(({ visible }) => visible)
                .map(({ label, variant, onClick, disabled }) => (
                  <Button
                    disabled={disabled}
                    key={label}
                    size="sm"
                    onClick={onClick}
                    variant={variant}
                  >
                    {label}
                  </Button>
                ))}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default EmailAgentMessage;
