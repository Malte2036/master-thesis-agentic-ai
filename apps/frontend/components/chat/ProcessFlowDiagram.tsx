'use client';

import {
  AgentToolCallWithResult,
  RouterProcess,
  ToolCallWithResult,
} from '@master-thesis-agentic-ai/types';
import {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo } from 'react';
import { useAutoLayout } from '../../lib/layout/useAutoLayout';
import { IterationNode } from './IterationNode';
import { QuestionNode } from './QuestionNode';
import { ResponseNode } from './ResponseNode';
import { ToolCallNode } from './ToolCallNode';

type ProcessFlowDiagramProps = {
  process: RouterProcess | undefined;
  isLoading: boolean;
};

// Type guard to check if a call is an agent tool call (outside component to avoid re-creation)
const isAgentToolCall = (
  call: ToolCallWithResult | AgentToolCallWithResult,
): call is AgentToolCallWithResult => {
  return 'type' in call && call.type === 'agent';
};

const nodeTypes: NodeTypes = {
  question: QuestionNode,
  iteration: IterationNode,
  toolCall: ToolCallNode,
  response: ResponseNode,
};

const ProcessFlowDiagramInner = ({
  process,
  isLoading,
}: ProcessFlowDiagramProps) => {
  const { applyLayout } = useAutoLayout();

  const createQuestionNode = useCallback(
    (question: string, prefix: string): Node => {
      return {
        id: `${prefix}question`,
        type: 'question',
        data: { question },
        position: { x: 0, y: 0 },
      };
    },
    [],
  );

  const createIterationNode = useCallback(
    (
      index: number,
      thought: string,
      isFinished: boolean,
      functionCallsCount: number,
      functionCalls: ToolCallWithResult[] | AgentToolCallWithResult[],
      prefix: string,
    ): Node => {
      return {
        id: `${prefix}iteration-${index}`,
        type: 'iteration',
        data: {
          iterationNumber: index,
          thought: thought,
          isFinished: isFinished,
          functionCallsCount: functionCallsCount,
          functionCalls: functionCalls,
        },
        position: { x: 0, y: 0 },
      };
    },
    [],
  );

  const createIterationEdge = useCallback(
    (index: number, nodeId: string, prefix: string): Edge => {
      if (index === 0) {
        return {
          id: `${prefix}edge-question-${nodeId}`,
          source: `${prefix}question`,
          target: nodeId,
          animated: true,
          style: { stroke: '#ef4444', strokeWidth: 2 },
        };
      } else {
        return {
          id: `${prefix}edge-iteration-${index - 1}-${index}`,
          source: `${prefix}iteration-${index - 1}`,
          sourceHandle: 'bottom',
          target: nodeId,
          animated: false,
          style: { stroke: '#a1a1aa' },
        };
      }
    },
    [],
  );

  const createMcpFunctionCallNode = useCallback(
    (
      iterationIndex: number,
      callIndex: number,
      call: ToolCallWithResult,
      prefix: string,
    ): Node => {
      const funcNodeId = `${prefix}iteration-${iterationIndex}-func-${callIndex}`;
      return {
        id: funcNodeId,
        type: 'toolCall',
        data: {
          functionName: call.function,
          args: call.args,
          result: call.result,
          isAgent: false,
        },
        position: { x: 0, y: 0 },
      };
    },
    [],
  );

  const createAgentFunctionCallNode = useCallback(
    (
      iterationIndex: number,
      callIndex: number,
      call: AgentToolCallWithResult,
      prefix: string,
    ): Node => {
      const funcNodeId = `${prefix}iteration-${iterationIndex}-func-${callIndex}`;
      return {
        id: funcNodeId,
        type: 'toolCall',
        data: {
          functionName: call.function,
          args: call.args,
          result: call.result,
          isAgent: true,
        },
        position: { x: 0, y: 0 },
      };
    },
    [],
  );

  const createFunctionCallEdge = useCallback(
    (iterationNodeId: string, funcNodeId: string, isAgent: boolean): Edge => {
      return {
        id: `edge-${iterationNodeId}-${funcNodeId}`,
        source: iterationNodeId,
        sourceHandle: 'right',
        target: funcNodeId,
        animated: false,
        style: {
          stroke: isAgent ? '#8b5cf6' : '#f59e42',
          strokeWidth: 1.5,
          strokeDasharray: '4 3',
        },
      };
    },
    [],
  );

  const createResponseNode = useCallback(
    (response: string, prefix: string): Node => {
      return {
        id: `${prefix}response`,
        type: 'response',
        data: {
          response: response,
        },
        position: { x: 0, y: 0 },
      };
    },
    [],
  );

  const createResponseEdge = useCallback(
    (lastIterationId: string, responseId: string, prefix: string): Edge => {
      return {
        id: `${prefix}edge-response`,
        source: lastIterationId,
        sourceHandle: 'bottom',
        target: responseId,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
      };
    },
    [],
  );

  const buildFlowFromProcess = useCallback(
    (process: RouterProcess | undefined) => {
      if (!process) return { nodes: [], edges: [] };

      const nodes: Node[] = [];
      const edges: Edge[] = [];

      // Helper function to process iteration nodes
      const processIterationNodes = (proc: RouterProcess, prefix: string) => {
        proc.iterationHistory.forEach((iteration, index) => {
          const nodeId = `${prefix}iteration-${index}`;

          const functionCalls =
            (iteration.structuredThought.functionCalls as
              | ToolCallWithResult[]
              | AgentToolCallWithResult[]) || [];
          nodes.push(
            createIterationNode(
              index,
              iteration.naturalLanguageThought,
              iteration.structuredThought.isFinished,
              functionCalls.length,
              functionCalls,
              prefix,
            ),
          );
          edges.push(createIterationEdge(index, nodeId, prefix));
        });
      };

      // Helper function to process function call nodes (recursive)
      const processFunctionCallNodes = (
        proc: RouterProcess,
        prefix: string,
      ): void => {
        proc.iterationHistory.forEach((iteration, index) => {
          const iterationNodeId = `${prefix}iteration-${index}`;
          const functionCalls =
            (iteration.structuredThought.functionCalls as
              | ToolCallWithResult[]
              | AgentToolCallWithResult[]) || [];

          functionCalls.forEach((call, callIdx) => {
            if (isAgentToolCall(call)) {
              // Create agent function call node
              const funcNode = createAgentFunctionCallNode(
                index,
                callIdx,
                call,
                prefix,
              );
              nodes.push(funcNode);
              edges.push(
                createFunctionCallEdge(iterationNodeId, funcNode.id, true),
              );

              // Recursively process internal router process if it exists
              const internalProcess = call.internalRouterProcess as
                | RouterProcess
                | null
                | undefined;
              if (
                internalProcess &&
                typeof internalProcess === 'object' &&
                'question' in internalProcess &&
                'iterationHistory' in internalProcess
              ) {
                const nestedPrefix = `${prefix}iter-${index}-func-${callIdx}-`;

                // Add question node for nested process
                nodes.push(
                  createQuestionNode(internalProcess.question, nestedPrefix),
                );

                // Connect agent node to nested question
                edges.push({
                  id: `edge-${funcNode.id}-${nestedPrefix}question`,
                  source: funcNode.id,
                  target: `${nestedPrefix}question`,
                  animated: true,
                  style: { stroke: '#8b5cf6', strokeWidth: 2 },
                });

                // Process nested iterations
                processIterationNodes(internalProcess, nestedPrefix);

                // Process nested function calls (recursive)
                processFunctionCallNodes(internalProcess, nestedPrefix);
              }
            } else {
              // Create MCP function call node
              const funcNode = createMcpFunctionCallNode(
                index,
                callIdx,
                call,
                prefix,
              );
              nodes.push(funcNode);
              edges.push(
                createFunctionCallEdge(iterationNodeId, funcNode.id, false),
              );
            }
          });
        });
      };

      const prefix = '';

      // Add node for user question
      nodes.push(createQuestionNode(process.question, prefix));

      // Process iteration nodes and edges
      processIterationNodes(process, prefix);

      // Process function call nodes and edges (including recursive agent calls)
      processFunctionCallNodes(process, prefix);

      // Add response node if there's a response
      if (process.response && process.iterationHistory.length > 0) {
        const lastIterationIndex = process.iterationHistory.length - 1;
        const lastIterationId = `${prefix}iteration-${lastIterationIndex}`;
        const responseId = `${prefix}response`;

        nodes.push(createResponseNode(process.response, prefix));

        edges.push(createResponseEdge(lastIterationId, responseId, prefix));
      }

      return { nodes, edges };
    },
    [
      createQuestionNode,
      createIterationNode,
      createIterationEdge,
      createMcpFunctionCallNode,
      createAgentFunctionCallNode,
      createFunctionCallEdge,
      createResponseNode,
      createResponseEdge,
    ],
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlowFromProcess(process),
    [process, buildFlowFromProcess],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildFlowFromProcess(process);
    setNodes(newNodes);
    setEdges(newEdges);

    // Apply auto-layout after nodes/edges are set
    if (newNodes.length > 0) {
      setTimeout(() => {
        applyLayout({ direction: 'vertical' });
      }, 100);
    }
  }, [process, buildFlowFromProcess, setNodes, setEdges, applyLayout]);

  if (!process && !isLoading) {
    return null;
  }

  return (
    <div className="w-full h-full overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{
          padding: 0.3,
          includeHiddenNodes: false,
          minZoom: 0.1,
          maxZoom: 1.2,
          duration: 200,
        }}
        minZoom={0.05}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap className="bg-white! dark:bg-zinc-800!" />
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider for auto-layout
export const ProcessFlowDiagram = (props: ProcessFlowDiagramProps) => {
  return (
    <ReactFlowProvider>
      <ProcessFlowDiagramInner {...props} />
    </ReactFlowProvider>
  );
};
