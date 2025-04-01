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
import { useCallback, useState } from "react";
import RenderMarkdown from "../RenderMarkdown";
import {
  NormalizedEmailResponse,
  NormalizedEmailThreadItem,
} from "@/types/emailAgentMessage";
import { toast } from "sonner";

import {
  BoldItalicUnderlineToggles,
  InsertImage,
  imagePlugin,
  MDXEditor,
  toolbarPlugin,
  UndoRedo,
  thematicBreakPlugin,
} from "@mdxeditor/editor";
import { headingsPlugin } from "@mdxeditor/editor";

import "@mdxeditor/editor/style.css";

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
  editable?: boolean;
  onEditBody?: (newValue: { body: string }) => void;
}

const LabelAndValue = ({
  label,
  value,
  labelClassName,
  editable = false,
  onEdit,
}: {
  label: string;
  value: string;
  labelClassName?: string;
  editable?: boolean;
  onEdit?: (value: string) => void;
}) => {
  const [mdValue, setMdValue] = useState(value);

  if (!value) return null;

  return (
    <div className="flex gap-1">
      <p
        className={clsx(
          "text-sm text-muted-foreground font-bold",
          labelClassName
          // { "pt-[0.75rem]": editable }
        )}
      >
        {label}{" "}
      </p>

      {editable ? (
        <MDXEditor
          className="dark-theme"
          markdown={mdValue}
          plugins={[
            // imagePlugin(),
            thematicBreakPlugin(),
            headingsPlugin(),
            toolbarPlugin({
              toolbarClassName: "bg-slate-700",
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <BoldItalicUnderlineToggles />
                  {/* <InsertImage /> */}
                </>
              ),
            }),
          ]}
          onBlur={() => {
            onEdit(mdValue.replace(/<br \/>/g, "\n"));
            setMdValue(mdValue);
          }}
          onChange={setMdValue}
        />
      ) : (
        <RenderMarkdown className="flex-1" message={mdValue} isUser={false} />
      )}
    </div>
  );
};

const EmailContent = ({
  from,
  to,
  subject,
  body,
  header,
  thread,
  editable = false,
  onEditBody,
}: EmailContentProps) => {
  const [threadOpen, setThreadOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-bold">{header}</h3>
      </div>
      <div className="flex flex-col gap-1">
        <LabelAndValue label="From" value={from} labelClassName="w-[80px]" />
        <LabelAndValue label="To" value={to} labelClassName="w-[80px]" />
        <LabelAndValue
          label="Subject"
          value={subject}
          labelClassName="w-[80px]"
        />
      </div>

      <div className="">
        <div className="flex flex-col gap-1">
          <LabelAndValue
            editable={editable}
            label="Body"
            value={body}
            labelClassName="w-[80px]"
            onEdit={(newBody) => {
              onEditBody({ body: newBody });
            }}
          />

          {!!thread?.length && (
            <Collapsible
              className="w-full"
              open={threadOpen}
              onOpenChange={() => setThreadOpen(!threadOpen)}
            >
              <div className="mt-1">
                <div className="flex items-center justify-between ">
                  <p>Thread:</p>
                  <CollapsibleTrigger>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setThreadOpen(!threadOpen)}
                    >
                      {threadOpen ? <UnfoldVertical /> : <FoldVertical />}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  {thread.map(({ from, timestamp, body }) => (
                    <div className="mt-1">
                      <div className="border-t border-slate-700 w-full my-2"></div>
                      <div className="pl-[80px]">
                        <p className="text-xs text-muted-foreground">
                          {from} - {new Date(timestamp).toLocaleDateString()}
                        </p>
                        <RenderMarkdown message={body} isUser={false} />
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
};

const EmailAgentMessage = ({ message }: QuickReplyBuilderProps) => {
  const { summary } = message.metadata;
  const { email_received, email_drafted, email_sent, reasoning } =
    message.content as unknown as NormalizedEmailResponse;

  const [open, setOpen] = useState(!!email_drafted);
  const [isSending, setIsSending] = useState(false);

  const { triggerFunctionCall, replaceMessage, handleUpdateMessage } =
    useChat();

  const onUpdateContentPath = useCallback(
    (path: string, value: string | object) => {
      handleUpdateMessage({
        id: message.id,
        content: {
          ...message.content,
          [path]: value,
        },
        role: message.role,
        metadata: message.metadata,
        tenant_id: message.tenant_id,
      });
    },
    [message, handleUpdateMessage]
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
    {
      label: "Ignore",
      variant: "outline-destructive",
      visible: !!email_drafted,
      disabled: isSending,
      onClick: () => {
        // triggerFunctionCall({
        //   type: "email:discard",
        //   message_id: message.id,
        // });
      },
    },
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

  return (
    <Collapsible
      className="w-full"
      open={open}
      onOpenChange={() => {
        setOpen(!open);
      }}
    >
      <div className={getContainerStyles({ isUser: false }) + " w-full"}>
        <div
          className={clsx(
            messageBubbleStyles,
            otherMessageStyles,
            "flex flex-col gap-3 !py-4  relative min-h-20",
            { "rounded-b-none": open }
          )}
        >
          {!open && (
            <div className="flex flex-col gap-1">
              <LabelAndValue
                labelClassName="w-[80px]"
                label="Status"
                value={statusText}
              />
              <LabelAndValue
                labelClassName="w-[80px]"
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
              />
            </div>
          )}
          <div className="p-4 absolute top-0 right-0">
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
                <div className="border-t border-slate-700 w-full my-2"></div>
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
                <div className="border-t border-slate-700 w-full my-2"></div>
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
