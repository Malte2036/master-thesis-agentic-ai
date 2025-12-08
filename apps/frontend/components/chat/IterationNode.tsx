'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { memo, useState } from 'react';
import {
  AgentToolCallWithResult,
  ToolCallWithResult,
} from '@master-thesis-agentic-ai/types';

export type IterationNodeData = {
  iterationNumber: number;
  thought: string;
  todoThought?: string;
  isFinished: boolean;
  functionCallsCount: number;
  functionCalls: unknown[];
};

export type IterationNode = Node<IterationNodeData, 'iteration'>;

export const IterationNode = memo(({ data }: NodeProps<IterationNode>) => {
  const {
    iterationNumber,
    thought,
    todoThought,
    isFinished,
    functionCallsCount,
    functionCalls,
  } = data;
  const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);
  const [isTodoExpanded, setIsTodoExpanded] = useState(false);
  const [isStructuredExpanded, setIsStructuredExpanded] = useState(false);

  const truncatedThought = thought.slice(0, 100);
  const needsTruncation = thought.length > 100;

  const minimisedFunctionCalls = functionCalls.map((call) => ({
    ...(call as ToolCallWithResult | AgentToolCallWithResult),
    result: undefined,
    internalRouterProcess: undefined,
  }));

  return (
    <div
      className="px-4 py-3 rounded-xl border-2 min-w-[250px] max-w-[450px] transition-all shadow-md"
      style={{
        background: '#ffffff',
        borderColor: isFinished ? '#10b981' : '#3b82f6',
        color: '#1e40af',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: isFinished ? '#10b981' : '#3b82f6',
          width: 10,
          height: 10,
        }}
      />

      {/* Iteration Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-blue-600">
            💭 Iteration {iterationNumber}
          </div>
          {isFinished && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
              ✓ FINISHED
            </span>
          )}
        </div>
      </div>

      {/* Natural Language Thought */}
      <div
        className="text-sm text-gray-700 leading-relaxed cursor-pointer mb-2"
        onClick={() =>
          needsTruncation && setIsThoughtExpanded(!isThoughtExpanded)
        }
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-600">
            Natural Language Thought:
          </span>
          {needsTruncation && (
            <span className="text-xs opacity-60">
              {isThoughtExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>
        <div>
          {isThoughtExpanded ? thought : truncatedThought}
          {!isThoughtExpanded && needsTruncation && (
            <span className="text-blue-500">...</span>
          )}
        </div>
      </div>

      {/* Todo List Section */}
      {todoThought && (
        <div
          className="border-t border-gray-200 pt-2 mb-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsTodoExpanded(!isTodoExpanded);
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-orange-600 flex items-center gap-1">
              <span>✅ Todo List</span>
            </div>
            <span className="text-xs opacity-60">
              {isTodoExpanded ? '▼' : '▶'}
            </span>
          </div>

          {isTodoExpanded && (
            <div className="mt-2">
              <div className="text-[11px] text-gray-700 bg-orange-50 rounded px-2 py-1 max-h-[200px] overflow-y-auto">
                <pre className="whitespace-pre-wrap">{todoThought}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured Thought Section */}
      <div
        className="border-t border-gray-200 pt-2 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setIsStructuredExpanded(!isStructuredExpanded);
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
            <span>⚙️ Structured Thought</span>
          </div>
          <span className="text-xs opacity-60">
            {isStructuredExpanded ? '▼' : '▶'}
          </span>
        </div>

        {isStructuredExpanded && (
          <div className="mt-2">
            {functionCallsCount > 0 ? (
              <div className="text-[11px] text-gray-700 bg-blue-50 rounded px-2 py-1 max-h-[300px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono">
                  {JSON.stringify(minimisedFunctionCalls, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-[11px] text-gray-700 bg-blue-50 rounded px-2 py-1">
                <span className="opacity-60">No function calls</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: isFinished ? '#10b981' : '#3b82f6',
          width: 10,
          height: 10,
          bottom: -5,
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: isFinished ? '#10b981' : '#3b82f6',
          width: 10,
          height: 10,
        }}
      />
    </div>
  );
});

IterationNode.displayName = 'IterationNode';
