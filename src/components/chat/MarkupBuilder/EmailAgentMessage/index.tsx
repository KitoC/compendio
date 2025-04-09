import { ChatMessage } from "@/types/chat";
import { useIsMobile } from "@/hooks/use-mobile";
import EmailModalContent from "./EmailModalContent";
import {
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { Dialog } from "@/components/ui/dialog";
import {
  MailCheck,
  MailPlus,
  MailX,
  MailQuestion,
  LucideProps,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { NormalizedEmailResponse } from "@/types/emailAgentMessage";
import { useChat } from "@/hooks/useChat";
import { Button, ButtonProps } from "@/components/ui/button";
import { toast } from "sonner";
import EmailMessageBubble from "./EmailMessageBubble";
import { SlidePanel } from "@/components/ui/slide-panel";
import FromAndToLabel from "./FromAndToLabel";
import { PRIORITIES, EMAIL_STATUSES } from "./consts";
interface EmailAgentMessageProps {
  message: ChatMessage;
  compact?: boolean;
}

const getIcon = (
  status: (typeof EMAIL_STATUSES)[keyof typeof EMAIL_STATUSES]
): React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
> => {
  if (status.value === "sent") return MailCheck;
  if (status.value === "draft") return MailQuestion;
  if (status.value === "received") return MailPlus;
  if (status.value === "failed") return MailX;
};

const EmailAgentMessage = ({ message, compact }: EmailAgentMessageProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { triggerFunctionCall, replaceMessage, handleUpdateMessage } =
    useChat();
  const { metadata } = message;
  const { email_drafted, email_received } =
    message.content as unknown as NormalizedEmailResponse;

  const status =
    EMAIL_STATUSES[metadata?.status as keyof typeof EMAIL_STATUSES];
  const statusText = status.label;

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

  const Icon = status.Icon;
  const priority =
    PRIORITIES[message.metadata?.priority as keyof typeof PRIORITIES];

  const Badges = (
    <div className="flex items-center gap-1">
      <Badge variant="outline-muted" className="font-bold text-[10px] px-1.5">
        {statusText} <status.Icon className="ml-1 w-4 h-4" />
      </Badge>
      {message.metadata?.priority && (
        <Badge
          variant="default"
          className={`font-bold text-[10px] px-1.5 ${priority.color}`}
        >
          {priority.label}
        </Badge>
      )}
    </div>
  );

  const buttonMarkup = buttons
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
    ));

  const headerContent = (
    <div className="flex flex-col items-start gap-2 w-full">
      <div>{Badges}</div>
      <div className="flex flex-col items-start gap-1 w-full">
        <FromAndToLabel
          fromEmail={email_received?.from}
          fromName={email_received?.from_name}
        />
        <p className="text-xs text-muted-foreground truncate w-full text-left">
          Subject:
          <span className="font-bold"> {email_received?.subject}</span>
        </p>
      </div>
    </div>
  );
  if (isMobile) {
    return (
      <>
        <EmailMessageBubble
          badges={Badges}
          message={message}
          onClick={() => setOpen(true)}
          compact={compact}
        />
        <SlidePanel
          headerContent={headerContent}
          side="bottom"
          open={open}
          onOpenChange={setOpen}
          footer={<div className="flex justify-end gap-2">{buttonMarkup}</div>}
          className="rounded-t-md"
          headerClassName="pb-2"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          <EmailModalContent
            message={message}
            statusText={statusText}
            Icon={Icon}
          />
        </SlidePanel>
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <EmailMessageBubble
          badges={Badges}
          message={message}
          onClick={() => setOpen(true)}
        />
      </DialogTrigger>
      <DialogContent
        className="p-4 border-0 max-w-3xl h-[80vh] bg-white"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>{headerContent}</DialogHeader>
        <div className="h-full overflow-y-auto">
          <EmailModalContent
            message={message}
            statusText={statusText}
            Icon={Icon}
          />
        </div>
        <DialogFooter>{buttonMarkup}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailAgentMessage;
