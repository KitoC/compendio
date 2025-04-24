import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getTriggerText,
  TRIGGER_ICONS,
  TRIGGER_TYPES,
} from "../consts/triggers";
import TriggerModal from "./TriggerModal";
import { useCustomTables } from "@/contexts/CustomTables";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useCallback } from "react";
import { useWorkflowEditor } from "@/contexts/WorkflowEditorProvider";
import RenderMarkdown from "@/components/chat/RenderMarkdown";

const TriggerCard = ({ trigger, isOpen, setIsOpen }) => {
  const { workflow, updateWorkflow } = useWorkflowEditor();
  const Icon = TRIGGER_ICONS[trigger.event_type];
  const { tables } = useCustomTables();

  const removeTrigger = useCallback(() => {
    updateWorkflow({
      ...workflow,
      triggers: workflow.triggers.filter((t) => t.id !== trigger.id),
    });
  }, [trigger, updateWorkflow, workflow]);

  return (
    <>
      <Card
        onClick={() => setIsOpen(!isOpen)}
        className={cn("p-2 !rounded-sm")}
      >
        <CardContent className="p-2 flex items-start gap-2">
          <Icon className="w-4 h-4" />

          <div className="flex flex-col gap-1">
            <RenderMarkdown
              key={trigger.id}
              message={getTriggerText(trigger, tables).markdown}
              className="flex items-center gap-2 text-xs"
              isUser={false}
            />

            {trigger.event_type === TRIGGER_TYPES.RECORD_UPDATED &&
              trigger?.metadata?.fields && (
                <p className="text-xs text-muted-foreground">
                  Watching {trigger?.metadata?.fields.length} fields
                </p>
              )}
          </div>
          <Button
            variant="ghost"
            size="icon-only"
            className="ml-auto hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              removeTrigger();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
      <TriggerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        id={trigger.id}
      />
    </>
  );
};

export default TriggerCard;
