import dagre from '@dagrejs/dagre';
import { type Edge, type Node, useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';

export type LayoutDirection = 'horizontal' | 'vertical';

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeSpacing?: { x: number; y: number };
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export const useAutoLayout = () => {
  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow();

  const applyLayout = useCallback(
    async (options: LayoutOptions = {}) => {
      const { direction = 'vertical', nodeSpacing = { x: 200, y: 150 } } = options;
      const isHorizontal = direction === 'horizontal';

      const nodes = getNodes();
      const edges = getEdges();

      // Configure dagre graph
      dagreGraph.setGraph({
        rankdir: isHorizontal ? 'LR' : 'TB',
        nodesep: nodeSpacing.y,
        ranksep: nodeSpacing.x,
        ranker: 'tight-tree',
      });

      // Clear previous graph
      nodes.forEach((node) => dagreGraph.removeNode(node.id));
      edges.forEach((edge) => dagreGraph.removeEdge(edge.source, edge.target));

      // Add nodes to dagre
      nodes.forEach((node) => {
        // Use measured dimensions or defaults
        const width = node.measured?.width || node.width || 250;
        const height = node.measured?.height || node.height || 100;
        dagreGraph.setNode(node.id, { width, height });
      });

      // Add edges to dagre
      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      // Calculate layout
      dagre.layout(dagreGraph);

      // Apply layout to nodes
      const layoutedNodes: Node[] = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const width = node.measured?.width || node.width || 250;
        const height = node.measured?.height || node.height || 100;

        return {
          ...node,
          position: {
            // Dagre uses center position, convert to top-left
            x: nodeWithPosition.x - width / 2,
            y: nodeWithPosition.y - height / 2,
          },
        };
      });

      setNodes(layoutedNodes);
      setEdges(edges);

      // Fit view with animation
      setTimeout(() => {
        fitView({ duration: 400, padding: 0.2 });
      }, 50);
    },
    [getNodes, getEdges, setNodes, setEdges, fitView],
  );

  return { applyLayout };
};

