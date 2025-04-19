import { Workflow, WorkflowTrigger } from "@/types/workflows";
import NODE_TYPES from "./consts/nodes";

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
      type: NODE_TYPES.TRIGGER,
      measured: { height: 0, width: 0 },
    },
  ];
  const edges = [];

  if (triggers.length) {
    edges.push({
      id: "add-action-edge",
      source: nodes[nodes.length - 1].id,
      target: "add-action-node",
    });

    nodes.push({
      id: "add-action-node",
      data: { label: "Add Action", triggers, workflowId: workflow.id },
      position: { x: 0, y: 0 },
      draggable: false,
      type: NODE_TYPES.ADD_ACTION,
      measured: { height: 0, width: 0 },
    });
  }

  return { nodes, edges };
};

export default buildNodesAndEdges;
