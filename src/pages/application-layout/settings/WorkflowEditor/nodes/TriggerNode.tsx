import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import TriggerSelect from "../components/TriggerSelect";
import { WorkflowTrigger } from "@/types/workflows";
import { useTenant } from "@/contexts/TenantContext";
import TriggerCard from "../components/TriggerCard";
import { NODE_BORDER, NODE_WIDTH } from "../consts/nodes";
import pluralize from "pluralize";
import { cn } from "@/lib/utils";
import { useWorkflowEditor } from "@/contexts/WorkflowEditorProvider";
import { v4 as uuidv4 } from "uuid";

type TriggerNodeProps = {
  data: {
    color: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    triggers: WorkflowTrigger[];
    workflowId: string;
  };
  isConnectable: boolean;
};

const TriggerNode = memo(({ data, isConnectable }: TriggerNodeProps) => {
  const { tenantId } = useTenant();
  const {
    workflow,
    updateWorkflow,
    setCurrentlyOpenModal,
    currentlyOpenModal,
  } = useWorkflowEditor();
  const { triggers = [] } = data;

  const onAddTrigger = (event_type: string) => {
    updateWorkflow({
      ...workflow,
      triggers: [
        ...workflow.triggers,
        {
          id: uuidv4(),
          workflow_id: data.workflowId,
          event_type,
          metadata: {},
          tenant_id: tenantId,
        },
      ],
    });
  };

  const toggleTriggerModal = (triggerId: string) => {
    setCurrentlyOpenModal(currentlyOpenModal === triggerId ? null : triggerId);
  };

  return (
    <div className={NODE_WIDTH}>
      <div className="p-3 w-full flex justify-start text-xs text-muted-foreground font-medium">
        <p>
          {triggers.length} {pluralize("trigger", triggers.length)}
        </p>
      </div>
      <div
        className={cn("flex flex-col gap-2 relative", {
          [NODE_BORDER.VALID]: triggers.length > 0,
          [NODE_BORDER.INVALID]: triggers.length === 0,
        })}
      >
        <div className="flex flex-col gap-2 p-2">
          {triggers
            .sort((a, b) => {
              const defaultDate = new Date().toISOString();

              return (a.created_at || defaultDate).localeCompare(
                b.created_at || defaultDate
              );
            })
            .map((trigger) => (
              <TriggerCard
                key={trigger.id}
                trigger={trigger}
                isOpen={currentlyOpenModal === trigger.id}
                setIsOpen={() => toggleTriggerModal(trigger.id)}
              />
            ))}

          {triggers.length === 0 && (
            <div className="flex flex-col gap-2">
              <TriggerSelect onChange={onAddTrigger} value={""} />
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default TriggerNode;
