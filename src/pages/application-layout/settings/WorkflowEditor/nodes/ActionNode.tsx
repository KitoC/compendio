import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { NODE_WIDTH } from "../consts/nodes";

type ActionNodeProps = {
  data: {
    name: string;
  };
  isConnectable: boolean;
  type: string;
};

const ActionNode = memo(({ data, isConnectable, type }: ActionNodeProps) => {
  const { name } = data;

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
        Action
        {/* <ActionCard action={action} isOpen={false} setIsOpen={() => {}} /> */}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default ActionNode;
