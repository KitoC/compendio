import { Workflow, WorkflowTrigger } from "@/types/workflows";

const buildNodesAndEdges = (
  workflow: Workflow,
  triggers: WorkflowTrigger[]
) => {
  const nodes = [
    {
      id: "triggers",
      data: { label: "Triggers", triggers, workflowId: workflow.id },
      position: { x: 0, y: 0 },
      draggable: false,
      type: "trigger-node",
      measured: { height: 0, width: 0 },
    },
  ];
  const edges = [];

  return { nodes, edges };
};

export default buildNodesAndEdges;
