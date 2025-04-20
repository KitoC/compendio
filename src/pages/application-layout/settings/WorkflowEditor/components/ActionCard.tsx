import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getActionText, ACTION_ICONS } from "../consts/actions";
import { useCustomTables } from "@/contexts/CustomTables";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState, useCallback } from "react";
import { NODE_CARD } from "../consts/nodes";
import ActionModal from "./ActionModal";
import { useWorkflowEditor } from "@/contexts/WorkflowEditorProvider";

const ActionCard = ({ action }) => {
  const {
    workflow,
    updateWorkflow,
    setCurrentlyOpenModal,
    currentlyOpenModal,
  } = useWorkflowEditor();
  const Icon = ACTION_ICONS[action.action_type];
  const { tables } = useCustomTables();

  const removeAction = useCallback(() => {
    updateWorkflow({
      ...workflow,
      actions: workflow.actions.filter((a) => a.id !== action.id),
    });
  }, [action, updateWorkflow, workflow]);

  const isValid = false;

  return (
    <>
      <Card
        onClick={() => setCurrentlyOpenModal(action.id)}
        className={cn("p-2 !rounded-sm", {
          [NODE_CARD.VALID]: isValid,
          [NODE_CARD.INVALID]: !isValid,
        })}
      >
        <CardContent className="p-2 flex items-start gap-2">
          <Icon className="w-4 h-4" />

          <div className="flex flex-col gap-1">
            <p key={action.id} className="flex items-center gap-2 text-xs">
              {getActionText(action, tables)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-only"
            className="ml-auto hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              removeAction();
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
      <ActionModal
        isOpen={currentlyOpenModal === action.id}
        onClose={() => setCurrentlyOpenModal(null)}
        id={action.id}
        workflowId={action.workflowId}
      />
    </>
  );
};

export default ActionCard;
