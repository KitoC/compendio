import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getActionText,
  ACTION_ICONS,
  ACTION_CARD_INFO,
} from "../consts/actions";
import { ACTION_VALIDATIONS } from "../consts/actions/action_validations";
import { useCustomTables } from "@/contexts/CustomTables";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useCallback } from "react";
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
      metadata: {
        ...workflow.metadata,
        connections: workflow.metadata.connections.filter(
          (c) => ![c.source, c.target].includes(action.id)
        ),
      },
      actions: workflow.actions.filter((a) => a.id !== action.id),
    });
  }, [action, updateWorkflow, workflow]);

  const isValid = ACTION_VALIDATIONS[action.action_type](action);
  const cardInfo = ACTION_CARD_INFO[action.action_type](action);

  return (
    <>
      <Card
        onClick={() => setCurrentlyOpenModal(action.id)}
        className={cn("p-2 !rounded-sm", {
          [NODE_CARD.VALID]: isValid,
          [NODE_CARD.INVALID]: !isValid,
        })}
      >
        <CardContent className="p-2 flex items-start gap-2 w-full">
          <Icon className="w-4 h-4" />

          <div className="flex flex-col gap-1 max-w-[80%]">
            <p key={action.id} className="flex items-center gap-2 text-xs ">
              {getActionText(action, tables).plainText}
            </p>
            {cardInfo}
          </div>
          <Button
            variant="ghost"
            size="icon-only"
            className="ml-auto hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentlyOpenModal(null);
              setTimeout(() => {
                removeAction();
              }, 100);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
      <ActionModal
        isOpen={action && currentlyOpenModal === action.id}
        onClose={() => setCurrentlyOpenModal(null)}
        id={action.id}
      />
    </>
  );
};

export default ActionCard;
