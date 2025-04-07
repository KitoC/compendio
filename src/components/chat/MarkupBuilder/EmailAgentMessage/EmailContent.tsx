import { Button } from "../../../ui/button";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FoldVertical, UnfoldVertical } from "lucide-react";
import { useState } from "react";
import RenderMarkdown from "../../RenderMarkdown";

import { LabelAndValue } from "./LabelAndValue";
import { EmailContentProps } from "./types";

export const EmailContent = ({
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
        <LabelAndValue
          label="From"
          value={from}
          labelClassName="w-[80px]"
          valueClassName="text-xs truncate"
        />
        <LabelAndValue
          label="To"
          value={to}
          labelClassName="w-[80px]"
          valueClassName="text-xs truncate"
        />
        <LabelAndValue
          label="Subject"
          value={subject}
          labelClassName="w-[80px]"
          valueClassName="text-xs"
        />
      </div>

      <div className="">
        <div className="flex flex-col gap-1">
          <LabelAndValue
            editable={editable}
            label="Body"
            isMarkdown
            value={body}
            labelClassName="w-[80px] min-w-[80px]"
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
