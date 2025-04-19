import React, { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import TriggerSelect from "../components/TriggerSelect";
import { WorkflowTrigger } from "@/types/workflows";
import { useCreateWorkflowTrigger } from "@/hooks/useWorkflowsQuery";
import { useTenant } from "@/contexts/TenantContext";
import TriggerCard from "../components/TriggerCard";
import { NODE_WIDTH } from "../consts/nodes";

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
  const [openTriggerId, setOpenTriggerId] = useState<string | null>(null);
  const { tenantId } = useTenant();
  const { triggers = [] } = data;

  const createTrigger = useCreateWorkflowTrigger();
  const onAddTrigger = (event_type: string) => {
    createTrigger.mutate({
      workflow_id: data.workflowId,
      event_type,
      metadata: {},
      tenant_id: tenantId,
    });
  };

  const toggleTriggerModal = (triggerId: string) => {
    setOpenTriggerId(openTriggerId === triggerId ? null : triggerId);
  };

  return (
    <div className={NODE_WIDTH}>
      <div className="p-3 w-full flex justify-start text-xs text-muted-foreground font-medium">
        <p>{triggers.length} Triggers</p>
      </div>
      <div className="flex flex-col gap-2 border border-dashed border-2 border-primary rounded-sm relative">
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
                isOpen={openTriggerId === trigger.id}
                setIsOpen={() => toggleTriggerModal(trigger.id)}
              />
            ))}

          <div className="flex flex-col gap-2">
            <TriggerSelect onChange={onAddTrigger} value={""} />
          </div>
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
