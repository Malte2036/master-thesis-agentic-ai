'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { memo, useState } from 'react';

export type ResponseNodeData = {
  response: string;
};

export type ResponseNode = Node<ResponseNodeData, 'response'>;

export const ResponseNode = memo(({ data }: NodeProps<ResponseNode>) => {
  const { response } = data;
  const [isExpanded, setIsExpanded] = useState(false);

  const truncatedResponse = response.slice(0, 150);
  const needsTruncation = response.length > 150;

  return (
    <div
      className="px-4 py-3 rounded-xl border-2 min-w-[300px] max-w-[500px] cursor-pointer transition-all shadow-lg"
      style={{
        background: '#f0fdf4',
        borderColor: '#10b981',
        color: '#065f46',
      }}
      onClick={() => needsTruncation && setIsExpanded(!isExpanded)}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#10b981',
          width: 12,
          height: 12,
        }}
      />

      {/* Response Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <div className="text-sm font-bold text-green-700 uppercase tracking-wide">
            Final Response
          </div>
        </div>
        {needsTruncation && (
          <span className="text-xs opacity-60">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
      </div>

      {/* Response Content */}
      <div className="text-sm text-gray-800 leading-relaxed">
        {isExpanded ? response : truncatedResponse}
        {!isExpanded && needsTruncation && (
          <span className="text-green-600">...</span>
        )}
      </div>
    </div>
  );
});

ResponseNode.displayName = 'ResponseNode';

