import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type UnknownNodeProps = {
  data: {
    name: string;
  };
  isConnectable: boolean;
  type: string;
};

const UnknownNode = memo(({ data, isConnectable, type }: UnknownNodeProps) => {
  const { name } = data;

  return (
    <Card className={cn("p-2 w-[300px] !rounded-sm")}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <CardContent className="p-2">
        <p>
          Unknown Node:{type} - {name}
        </p>
      </CardContent>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </Card>
  );
});

export default UnknownNode;
