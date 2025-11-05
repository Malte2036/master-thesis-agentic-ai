'use client';

import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { memo } from 'react';

export type QuestionNodeData = {
  question: string;
};

export type QuestionNode = Node<QuestionNodeData, 'question'>;

export const QuestionNode = memo(({ data }: NodeProps<QuestionNode>) => {
  const { question } = data;

  return (
    <div
      className="px-4 py-3 rounded-xl border-2 min-w-[280px] max-w-[500px] shadow-lg"
      style={{
        background: '#fff',
        borderColor: '#ef4444',
        color: '#991b1b',
      }}
    >
      {/* Question Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">❓</span>
        <div className="text-xs font-bold text-red-600 uppercase tracking-wide">
          Question
        </div>
      </div>

      {/* Question Content */}
      <div className="text-sm font-medium text-gray-800 leading-relaxed">
        {question}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#ef4444',
          width: 12,
          height: 12,
          bottom: -6,
        }}
      />

      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#ef4444',
          width: 10,
          height: 10,
        }}
      />
    </div>
  );
});

QuestionNode.displayName = 'QuestionNode';
