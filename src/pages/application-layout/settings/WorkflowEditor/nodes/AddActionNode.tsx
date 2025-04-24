import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import ActionSelect from "../components/ActionSelect";
import { NODE_WIDTH } from "../consts/nodes";
import { v4 as uuidv4 } from "uuid";
import { useWorkflowEditor } from "@/contexts/WorkflowEditorProvider";
import { DEFAULT_ACTION_TYPE_DATA } from "../consts/actions";

type AddActionNodeProps = {
  data: {
    connectionParentId: string;
  };
  isConnectable: boolean;
};

const AddActionNode = memo(({ isConnectable, data }: AddActionNodeProps) => {
  const { workflow, updateWorkflow, setCurrentlyOpenModal } =
    useWorkflowEditor();

  const onAddAction = (action: string) => {
    const actionId = uuidv4();

    setCurrentlyOpenModal(actionId);

    updateWorkflow({
      ...workflow,
      metadata: {
        ...workflow.metadata,
        connections: [
          ...(workflow.metadata?.connections || []),
          { source: data.connectionParentId, target: actionId },
        ],
      },
      actions: [
        ...workflow.actions,
        {
          id: actionId,
          action_type: action,
          metadata: DEFAULT_ACTION_TYPE_DATA[action] || {},
          position: (workflow.actions.length + 1).toString(),
          tenant_id: workflow.tenant_id,
          workflow_id: workflow.id,
        },
      ],
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border border-dashed border-2 border-primary rounded-sm relative",
        NODE_WIDTH
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="p-2">
        <ActionSelect onChange={onAddAction} value={""} />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default AddActionNode;
