import { Button } from "../../../ui/button";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FoldVertical, UnfoldVertical } from "lucide-react";
import { useState } from "react";
import RenderMarkdown from "../../RenderMarkdown";
import { Divider } from "@/components/ui/divider";

import { LabelAndValue, Markdown } from "./LabelAndValue";
import { EmailContentProps } from "./types";
import FromAndToLabel from "./FromAndToLabel";
import { useDebouncedCallback } from "use-debounce";
import EmailEditor from "./EmailEditor";
import { cn } from "@/lib/utils";

export const TYPES = {
  DRAFT: "draft",
  SENT: "sent",
  RECEIVED: "received",
};

export const EmailContent = ({
  from,
  to,
  body,
  header,
  thread,
  editable = false,
  onEditBody,
  type,
}: EmailContentProps) => {
  const [threadOpen, setThreadOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const debouncedOnUpdate = useDebouncedCallback(({ editor }) => {
    onEditBody({ body: editor.getHTML() });
  }, 750);

  return (
    <div className="flex flex-col gap-3 " onClick={() => setIsEditing(true)}>
      <div className="flex justify-end">
        <h3 className="text-sm font-bold">{header}</h3>
      </div>
      <div
        className={cn("bg-background p-4 rounded-md", {
          "bg-background mr-4": type === TYPES.RECEIVED,
          "bg-primary text-white ml-4 border": type === TYPES.SENT,
          "border border-2 border-dashed border-primary bg-primary/5 ml-4":
            type === TYPES.DRAFT,
        })}
      >
        <div className="">
          <div className="flex flex-col gap-1">
            <EmailEditor
              value={body}
              onUpdate={debouncedOnUpdate}
              editable={editable}
              autofocus={false}
              // onFocus={({ event }) => {
              //   console.log("isEditing", isEditing);
              //   console.log("focus", event);
              //   if (!isEditing) {
              //     event.target.blur();
              //   }
              // }}
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
    </div>
  );
};
