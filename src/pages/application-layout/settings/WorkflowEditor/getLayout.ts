import dagre from "@dagrejs/dagre";

interface Node {
  id: string;
  measured: {
    width: number;
    height: number;
  };
}

interface Edge {
  source: string;
  target: string;
}

type Direction = "TB" | "LR";

const getLayout = (
  nodes: Node[],
  edges: Edge[],
  direction: Direction = "TB"
) => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === "LR";

  dagreGraph.setGraph({
    rankdir: direction,
    edgesep: 10,
    ranksep: 60,
    nodesep: 50,
  });

  nodes.forEach((node) => {
    const { measured } = node;

    dagreGraph.setNode(node.id, {
      width: measured.width,
      height: measured.height,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      targetPosition: isHorizontal ? "left" : "top",
      sourcePosition: isHorizontal ? "right" : "bottom",
      position: {
        x: nodeWithPosition.x - node.measured.width / 2,
        y: nodeWithPosition.y - node.measured.height / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};

export default getLayout;
