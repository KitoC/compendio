import clsx from "clsx";
import { messageBubbleStyles, otherMessageStyles } from "../../shared.styles";
import { LabelAndValue } from "./LabelAndValue";

import { NormalizedEmailResponse } from "@/types/emailAgentMessage";
import { Divider } from "@/components/ui/divider";
import FromAndToLabel from "./FromAndToLabel";

const EmailMessageBubble = ({ message, onClick, badges, compact }) => {
  const {
    email_received,
    summary,
    short_summary = "This is my short summary",
  } = message.content as unknown as NormalizedEmailResponse;

  return (
    <div
      onClick={onClick}
      className={clsx(
        messageBubbleStyles,
        otherMessageStyles,
        "flex flex-col gap-3 !py-4  relative w-full",
        compact && "!py-2 !gap-1"
      )}
    >
      <div className="flex items-center gap-2">
        {compact && (
          <p className="text-xs text-muted-foreground mr-auto">
            {email_received?.from_name || "Kito"}
          </p>
        )}
        {badges}
      </div>

      <div className="flex flex-col gap-1">
        {!compact && (
          <>
            <FromAndToLabel
              fromEmail={email_received?.from}
              fromName={email_received?.from_name}
            />
            <Divider className="!my-1" />
          </>
        )}

        <LabelAndValue
          labelClassName=""
          label={compact ? "" : "AI Summary"}
          value={(short_summary || summary) as string}
          isMarkdown
        />
      </div>
    </div>
  );
};

export default EmailMessageBubble;
