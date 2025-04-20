import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import getLayout from "./getLayout";
import { Workflow } from "@/types/workflows";
import buildNodesAndEdges from "./buildNodesAndEdges";
import NODE_TYPES from "./consts/nodes";

import ActionNode from "./nodes/ActionNode";
import AddActionNode from "./nodes/AddActionNode";
import TriggerNode from "./nodes/TriggerNode";
import UnknownNode from "./nodes/UnknownNode";

interface WorkflowEditorProps {
  workflow: Workflow;
  isLoading: boolean;
}

const defaultEdgeOptions = {
  type: "smoothstep",
  style: {
    // stroke: "#000",
    strokeWidth: 2,
    strokeDasharray: "5 5",
  },
};

const nodeTypes = {
  [NODE_TYPES.TRIGGER]: TriggerNode,
  [NODE_TYPES.UNKNOWN]: UnknownNode,
  [NODE_TYPES.ADD_ACTION]: AddActionNode,
  [NODE_TYPES.ACTION]: ActionNode,
};

const WorkflowEditor = (props: WorkflowEditorProps) => {
  const reactFlow = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layouted, setLayouted] = useState(false);

  useEffect(() => {
    if (!layouted) {
      setLayouted(true);

      reactFlow.setViewport({
        zoom: 1.2,
        y: 100,
        x: 400,
      });
    }
  }, [nodes, edges, layouted, reactFlow]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(
      props.workflow
    );

    setNodes([...newNodes]);
    setEdges([...newEdges]);
  }, [props.workflow, setNodes, setEdges]);

  const layoutedNodesAndEdges = useMemo(() => {
    const isMeasured = nodes.every(
      (node) => node?.measured?.height && node?.measured?.width
    );

    if (!isMeasured) {
      return { nodes, edges };
    }

    return getLayout(nodes, edges, "TB");
  }, [nodes, edges]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={layoutedNodesAndEdges.nodes}
        edges={layoutedNodesAndEdges.edges}
        panOnScroll
        selectionOnDrag
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Background
          // variant={BackgroundVariant.Cross}
          gap={50}
          size={2}
        />
      </ReactFlow>
    </div>
  );
};

const ProvidedWorkflowEditor = (props: WorkflowEditorProps) => {
  return (
    <ReactFlowProvider>
      <WorkflowEditor {...props} />
    </ReactFlowProvider>
  );
};

export default ProvidedWorkflowEditor;
