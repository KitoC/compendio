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
import { Divider } from "@/components/ui/divider";
import { MessageService } from "@/services/MessageService";
import { useMutation } from "@tanstack/react-query";
import { FunctionService } from "@/services/functionService";
import { Alert } from "@/components/ui/alert";

interface EmailAgentMessageProps {
  message: ChatMessage;
  compact?: boolean;
  refetchMessages?: () => void;
}

const EmailAgentMessage = ({
  message,
  compact,
  refetchMessages,
}: EmailAgentMessageProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { replaceMessage } = useChat();
  const { metadata } = message;
  const { email_drafted, email_received } =
    message.content as unknown as NormalizedEmailResponse;

  const status =
    EMAIL_STATUSES[metadata?.status as keyof typeof EMAIL_STATUSES];
  const statusText = status.label;

  const sendEmailMutation = useMutation({
    onMutate: () => {
      return {
        id: message.id,
        action: "send-email",
        errMessage: "Error sending email",
      };
    },
    mutationKey: ["send-email"],
    mutationFn: async () => {
      const payload = {
        manual: true,
        name: "send_email",
        arguments: { message_id: message.id },
      };

      return FunctionService.triggerManualFunction(
        message?.user_id || "",
        payload
      );
    },
    onSuccess: (data) => {
      toast.success("Email sent successfully");
      replaceMessage(data as ChatMessage);
      refetchMessages?.();
      setOpen(false);
    },
  });

  const ignoreEmailMutation = useMutation({
    onMutate: () => {
      return {
        id: message.id,
        action: "ignore-email",
      };
    },
    mutationKey: ["ignore-email"],
    mutationFn: async () => {
      return MessageService.updateMessage({
        ...message,
        metadata: {
          ...metadata,
          status: "ignored",
        },
      });
    },
    onSuccess: (data) => {
      toast.success("Email ignored successfully");
      replaceMessage(data as ChatMessage);
      refetchMessages?.();
      setOpen(false);
    },
  });

  const buttons: {
    label: string;
    variant: ButtonProps["variant"];
    onClick: () => void;
    disabled?: boolean;
    visible?: boolean;
  }[] = [
    {
      label: ignoreEmailMutation.isPending ? "Ignoring..." : "Ignore",
      variant: "muted",
      visible: !!email_drafted,
      disabled: sendEmailMutation.isPending || ignoreEmailMutation.isPending,
      onClick: ignoreEmailMutation.mutate,
    },
    {
      label: sendEmailMutation.isPending ? "Sending..." : "Send",
      disabled: sendEmailMutation.isPending,
      variant: "default",
      visible: !!email_drafted,
      onClick: sendEmailMutation.mutate,
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
          variant={priority.variant}
          className="font-bold text-[10px] px-1.5"
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
      <div className="flex flex-col items-start gap-1 w-full border w-full rounded-md p-2">
        <FromAndToLabel
          fromEmail={email_received?.from}
          fromName={email_received?.from_name}
        />
        <Divider className="w-full !my-1 !h-[1px]" />
        <p className="text-sm text-muted-foreground truncate w-full text-left">
          <span className="font-bold"> {email_received?.subject}</span>
        </p>
      </div>
    </div>
  );

  const modalContent = (
    <>
      {sendEmailMutation.error && (
        <Alert
          variant="destructive"
          className="text-red-500 text-sm overflow-x-auto mb-2 w-full"
        >
          {sendEmailMutation.error.message}
          <pre className="text-red-500 text-sm overflow-x-auto mb-2 w-full">
            {JSON.stringify(sendEmailMutation.error)}
          </pre>
        </Alert>
      )}
      <EmailModalContent
        message={message}
        statusText={statusText}
        Icon={Icon}
      />
    </>
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
          {modalContent}
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
        <div className="h-full overflow-y-auto">{modalContent}</div>
        <DialogFooter>{buttonMarkup}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailAgentMessage;
