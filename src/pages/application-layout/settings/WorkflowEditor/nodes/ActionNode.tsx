import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { NODE_WIDTH } from "../consts/nodes";

import ActionCard from "../components/ActionCard";

type ActionNodeProps = {
  data: {
    id: string;
    label: string;
    metadata: {
      connections: { id: string; type: string; index: number }[];
    };
  };
  isConnectable: boolean;
  type: string;
};

const ActionNode = memo(({ data, isConnectable }: ActionNodeProps) => {
  return (
    <div className={cn("flex flex-col gap-2 rounded-sm relative", NODE_WIDTH)}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <ActionCard action={data} />

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default ActionNode;
