'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { memo, useState } from 'react';

export type ToolCallNodeData = {
  functionName?: string;
  args?: Record<string, unknown> | string;
  result?: string;
  isAgent: boolean;
};

export type ToolCallNode = Node<ToolCallNodeData, 'toolCall'>;

export const ToolCallNode = memo(({ data }: NodeProps<ToolCallNode>) => {
  const { functionName, args, result, isAgent } = data;
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDetails = Boolean(args || result);

  return (
    <div
      className="px-3 py-2 rounded-xl border-[1.5px] min-w-[180px] max-w-[400px] cursor-pointer transition-all"
      style={{
        background: isAgent ? '#ddd6fe' : '#fef3c7',
        borderColor: isAgent ? '#8b5cf6' : '#f59e42',
        color: isAgent ? '#6d28d9' : '#b45309',
      }}
      onClick={() => hasDetails && setIsExpanded(!isExpanded)}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: isAgent ? '#8b5cf6' : '#f59e42',
          width: 8,
          height: 8,
        }}
      />

      {/* Function Name */}
      <div className="text-sm font-semibold mb-1 flex items-center gap-1 justify-between">
        <div className="flex items-center gap-1">
          {isAgent ? '🤖' : '🔧'}
          <span>{functionName || 'Tool Call'}</span>
          {isAgent && <span className="text-xs opacity-70">(Agent)</span>}
        </div>
        {hasDetails && (
          <span className="text-xs opacity-60">{isExpanded ? '▼' : '▶'}</span>
        )}
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <>
          {/* Arguments */}
          {args && (
            <div className="mt-2">
              <div className="text-xs font-medium opacity-90 mb-1">
                Parameters:
              </div>
              <div className="text-[11px] opacity-75 wrap-break-word bg-white/30 rounded px-2 py-1 max-h-[200px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono">
                  {typeof args === 'string'
                    ? args
                    : JSON.stringify(args, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-2">
              <div className="text-xs font-medium opacity-90 mb-1">Result:</div>
              <div className="text-[11px] opacity-75 wrap-break-word bg-white/30 rounded px-2 py-1 max-h-[200px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono">{result}</pre>
              </div>
            </div>
          )}
        </>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: isAgent ? '#8b5cf6' : '#f59e42',
          width: 8,
          height: 8,
        }}
      />
    </div>
  );
});

ToolCallNode.displayName = 'ToolCallNode';
