'use client';

import ReactMarkdown from 'react-markdown';
import { ProcessFlowDiagram } from '../chat/ProcessFlowDiagram';
import { ProcessViewer } from '../chat/ProcessViewer';
import { EvaluationReportEntry } from '@master-thesis-agentic-ai/types';
import { useState } from 'react';

type TestCaseCardProps = {
  test: EvaluationReportEntry;
};

export const TestCaseCard = ({ test }: TestCaseCardProps) => {
  const [viewMode, setViewMode] = useState<'details' | 'flow' | 'list'>(
    'details',
  );
  const iterationCount = test.trace?.iterationHistory?.length || 0;
  const toolCallsCount = test.expected_tool_calls?.length || 0;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-50">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">{test.id}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              <span className="font-medium">Type:</span> {test.task_type}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{test.input}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-900">
              {test.completion_time.toFixed(2)}s
            </p>
            <p className="text-xs text-zinc-500">
              {iterationCount} iteration{iterationCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      {test.trace && (
        <div className="border-b border-zinc-200 bg-white px-6 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('details')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'details'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('flow')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'flow'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Flow Diagram
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* List View */}
        {viewMode === 'list' && test.trace && (
          <div className="h-full overflow-y-auto px-6 py-6">
            <ProcessViewer process={test.trace} isLoading={false} />
          </div>
        )}

        {/* Flow Diagram View */}
        {viewMode === 'flow' && test.trace && (
          <div className="h-full w-full">
            <ProcessFlowDiagram
              process={test.trace}
              isLoading={false}
              response={test.actual_output}
            />
          </div>
        )}

        {/* Details View */}
        {viewMode === 'details' && (
          <div className="h-full overflow-y-auto px-6 py-4">
            {/* Expected vs Actual Output */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-700">
                  Expected Output
                </h4>
                <div className="rounded-lg bg-white p-4 text-sm text-zinc-600">
                  {test.expected_output}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-700">
                  Actual Output
                </h4>
                <div className="prose prose-sm max-w-none rounded-lg bg-white p-4">
                  <ReactMarkdown>{test.actual_output}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Expected Tool Calls */}
            {test.expected_tool_calls &&
              test.expected_tool_calls.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-semibold text-zinc-700">
                    Expected Tool Calls ({toolCallsCount})
                  </h4>
                  <div className="space-y-2">
                    {test.expected_tool_calls.map((call, idx: number) => (
                      <div key={idx} className="rounded-lg bg-white p-3">
                        <div className="flex items-start gap-2">
                          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono text-blue-700">
                            {call.function}
                          </span>
                          {Object.keys(call.args).length > 0 && (
                            <pre className="flex-1 overflow-x-auto text-xs text-zinc-600">
                              {JSON.stringify(call.args, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
