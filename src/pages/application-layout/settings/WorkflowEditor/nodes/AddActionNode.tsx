import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import ActionSelect from "../components/ActionSelect";
import { NODE_WIDTH } from "../consts/nodes";

type AddActionNodeProps = {
  isConnectable: boolean;
};

const AddActionNode = memo(({ isConnectable }: AddActionNodeProps) => {
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
        <ActionSelect onChange={() => {}} value={""} />
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
