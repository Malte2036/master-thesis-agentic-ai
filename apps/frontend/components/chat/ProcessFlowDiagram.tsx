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
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo } from 'react';
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

export const ProcessFlowDiagram = ({
  process,
  isLoading,
}: ProcessFlowDiagramProps) => {
  const createQuestionNode = useCallback(
    (
      question: string,
      prefix: string,
      xOffset: number,
      yOffset: number,
    ): Node => {
      return {
        id: `${prefix}question`,
        type: 'question',
        data: { question },
        position: { x: xOffset, y: yOffset },
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
      xOffset: number,
      yOffset: number,
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
        position: { x: xOffset, y: yOffset + (index + 1) * 250 },
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
      xOffset: number,
      yOffset: number,
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
        position: {
          x: xOffset + 450 + callIndex * 350,
          y: yOffset + (iterationIndex + 1) * 250,
        },
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
      xOffset: number,
      yOffset: number,
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
        position: {
          x: xOffset + 450 + callIndex * 350,
          y: yOffset + (iterationIndex + 1) * 250,
        },
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
    (
      response: string,
      iterationCount: number,
      prefix: string,
      xOffset: number,
      yOffset: number,
    ): Node => {
      return {
        id: `${prefix}response`,
        type: 'response',
        data: {
          response: response,
        },
        position: { x: xOffset, y: yOffset + (iterationCount + 1) * 250 },
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
      const processIterationNodes = (
        proc: RouterProcess,
        prefix: string,
        xOffset: number,
        yOffset: number,
      ) => {
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
              xOffset,
              yOffset,
            ),
          );
          edges.push(createIterationEdge(index, nodeId, prefix));
        });
      };

      // Helper function to process function call nodes (recursive)
      const processFunctionCallNodes = (
        proc: RouterProcess,
        prefix: string,
        xOffset: number,
        yOffset: number,
        depth: number,
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
                xOffset,
                yOffset,
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
                const nestedXOffset = xOffset + 800 + depth * 600;
                const nestedYOffset = yOffset + (index + 1) * 250;

                // Add question node for nested process
                nodes.push(
                  createQuestionNode(
                    internalProcess.question,
                    nestedPrefix,
                    nestedXOffset,
                    nestedYOffset,
                  ),
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
                processIterationNodes(
                  internalProcess,
                  nestedPrefix,
                  nestedXOffset,
                  nestedYOffset,
                );

                // Process nested function calls (recursive)
                processFunctionCallNodes(
                  internalProcess,
                  nestedPrefix,
                  nestedXOffset,
                  nestedYOffset,
                  depth + 1,
                );
              }
            } else {
              // Create MCP function call node
              const funcNode = createMcpFunctionCallNode(
                index,
                callIdx,
                call,
                prefix,
                xOffset,
                yOffset,
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
      const xOffset = 0;
      const yOffset = 0;
      const depth = 0;

      // Add node for user question
      nodes.push(
        createQuestionNode(process.question, prefix, xOffset, yOffset),
      );

      // Process iteration nodes and edges
      processIterationNodes(process, prefix, xOffset, yOffset);

      // Process function call nodes and edges (including recursive agent calls)
      processFunctionCallNodes(process, prefix, xOffset, yOffset, depth);

      // Add response node if there's a response
      if (process.response && process.iterationHistory.length > 0) {
        const lastIterationIndex = process.iterationHistory.length - 1;
        const lastIterationId = `${prefix}iteration-${lastIterationIndex}`;
        const responseId = `${prefix}response`;

        nodes.push(
          createResponseNode(
            process.response,
            process.iterationHistory.length,
            prefix,
            xOffset,
            yOffset,
          ),
        );

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
  }, [process, buildFlowFromProcess, setNodes, setEdges]);

  if (!process && !isLoading) {
    return null;
  }

  return (
    <div className="w-full h-[700px] border border-zinc-200 rounded-lg overflow-hidden bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
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
