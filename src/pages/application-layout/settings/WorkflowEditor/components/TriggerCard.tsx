import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getTriggerText,
  TRIGGER_ICONS,
  TRIGGER_TYPES,
} from "../consts/triggers";
import TriggerModal from "./TriggerModal";
import { useCustomTables } from "@/contexts/CustomTables";
import { useDeleteWorkflowTrigger } from "@/hooks/useWorkflowsQuery";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { useState } from "react";

const TriggerCard = ({ trigger, isOpen, setIsOpen }) => {
  const Icon = TRIGGER_ICONS[trigger.event_type];
  const { tables } = useCustomTables();

  const deleteTriggerMutation = useDeleteWorkflowTrigger();

  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);

  return (
    <>
      <Card
        onClick={() => setIsOpen(!isOpen)}
        className={cn("p-2 w-[300px] !rounded-sm")}
      >
        <CardContent className="p-2 flex items-start gap-2">
          <Icon className="w-4 h-4" />

          <div className="flex flex-col gap-1">
            <p key={trigger.id} className="flex items-center gap-2 text-xs">
              {getTriggerText(trigger, tables)}
            </p>

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
              setShowConfirmationDialog(true);
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
      <ConfirmationDialog
        isOpen={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        title="Delete Trigger"
        description="Are you sure you want to delete this trigger?"
        onConfirm={() => deleteTriggerMutation.mutateAsync(trigger.id)}
        onConfirmText="Delete"
        onConfirmLoading={deleteTriggerMutation.isPending}
        disabled={deleteTriggerMutation.isPending}
      />
    </>
  );
};

export default TriggerCard;
