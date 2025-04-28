import { Workflow } from "@/types/workflows";
import NODE_TYPES from "./consts/nodes";
import { sortBy } from "lodash";

interface WorkflowNode {
  id: string;
  position: { x: number; y: number };
  draggable: boolean;
  type: string;
  measured: { height: number; width: number };
  data: Record<string, unknown>;
}

const buildNodesAndEdges = (workflow: Workflow) => {
  if (!workflow) {
    return { nodes: [], edges: [] };
  }
  const { triggers } = workflow;

  const workflowConnections = workflow?.metadata?.connections || [];

  const nodes: WorkflowNode[] = [
    {
      id: "triggers",
      data: {
        label: "Triggers",
        triggers,
        workflowId: workflow.id,
        position: "0",
      },
      position: { x: 0, y: 0 },
      draggable: false,
      type: NODE_TYPES.TRIGGER,
      measured: { height: 0, width: 0 },
    },
  ];

  const edges = [];

  const actionNodes = workflow.actions.map((action, index) => {
    return {
      id: action.id,
      data: {
        id: action.id,
        label: action.action_type,
        action_type: action.action_type,
        actionId: action.id,
        position: action.position,
        metadata: action.metadata,
        workflowId: action.workflow_id,
      },
      position: { x: index * 200, y: 0 },
      draggable: false,
      type: NODE_TYPES.ACTION,
      measured: { height: 0, width: 0 },
    };
  });

  nodes.push(...actionNodes);

  const lastNode = nodes.sort(
    (a, b) => Number(a.data.position) - Number(b.data.position)
  )[nodes.length - 1];

  workflowConnections.forEach((connection) => {
    edges.push({
      id: `${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
    });
  });

  if (lastNode) {
    edges.push({
      id: "add-action-edge",
      source: lastNode.id,
      target: "add-action-node",
    });

    nodes.push({
      id: "add-action-node",
      data: {
        label: "Add Action",
        connectionParentId: lastNode.id,
        triggers,
        workflowId: workflow.id,
      },
      position: { x: 0, y: 0 },
      draggable: false,
      type: NODE_TYPES.ADD_ACTION,
      measured: { height: 0, width: 0 },
    });
  }

  const filteredEdges = edges.filter((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);
    return sourceNode && targetNode;
  });

  return { nodes, edges: filteredEdges };
};

export default buildNodesAndEdges;
