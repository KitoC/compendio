import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import TriggerNode from "./nodes/TriggerNode";
import UnknownNode from "./nodes/UnknownNode";
import getLayout from "./getLayout";
import { Workflow, WorkflowTrigger } from "@/types/workflows";
import buildNodesAndEdges from "./buildNodesAndEdges";
import { usePrevious } from "@uidotdev/usehooks";

interface WorkflowEditorProps {
  workflow: Workflow;
  workflowTriggers: WorkflowTrigger[];
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
  "trigger-node": TriggerNode,
  "unknown-node": UnknownNode,
};

const WorkflowEditor = (props: WorkflowEditorProps) => {
  const reactFlow = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layouted, setLayouted] = useState(false);

  const onLayout = useCallback(
    (direction) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayout(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, setNodes, setEdges]
  );

  const measurements = useMemo(() => {
    return nodes.reduce(
      (acc, node) =>
        acc + (node?.measured.height || 0) + (node?.measured.width || 0),
      0
    );
  }, [nodes]);

  const previousMeasurements = usePrevious(measurements);

  useEffect(() => {
    const isMeasured = nodes.every((node) => node?.measured);

    if (!layouted && isMeasured && nodes.length) {
      onLayout("TB");
      setLayouted(true);

      reactFlow.setViewport({
        zoom: 1.2,
        y: 100,
        x: 400,
      });
    }
  }, [nodes, layouted, onLayout, reactFlow]);

  useEffect(() => {
    if (
      layouted &&
      previousMeasurements !== measurements &&
      measurements > 0 &&
      previousMeasurements > 0
    ) {
      onLayout("TB");
    }
  }, [measurements, layouted, onLayout, previousMeasurements]);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(
      props.workflow,
      props.workflowTriggers
    );

    setNodes([...newNodes]);
    setEdges([...newEdges]);
  }, [props.workflow, props.workflowTriggers, setNodes, setEdges]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
