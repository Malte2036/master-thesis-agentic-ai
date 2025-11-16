'use client';

import {
  AgentToolCallWithResult,
  RouterProcess,
  ToolCallWithResult,
} from '@master-thesis-agentic-ai/types';
import { useState } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Code,
  Eye,
} from 'lucide-react';

type ProcessViewerProps = {
  process: RouterProcess | undefined;
  isLoading: boolean;
  depth?: number;
};

// Type guard to check if a call is an agent tool call
const isAgentToolCall = (
  call: ToolCallWithResult | AgentToolCallWithResult,
): call is AgentToolCallWithResult => {
  return 'type' in call && call.type === 'agent';
};

export const ProcessViewer = ({
  process,
  isLoading,
  depth = 0,
}: ProcessViewerProps) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [expandedNestedProcess, setExpandedNestedProcess] = useState<
    Set<string>
  >(new Set());

  if (!process && !isLoading) {
    return null;
  }

  const toggleStep = (stepIndex: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepIndex)) {
      newExpanded.delete(stepIndex);
    } else {
      newExpanded.add(stepIndex);
    }
    setExpandedSteps(newExpanded);
  };

  const toggleNestedProcess = (nestedId: string) => {
    const newExpanded = new Set(expandedNestedProcess);
    if (newExpanded.has(nestedId)) {
      newExpanded.delete(nestedId);
    } else {
      newExpanded.add(nestedId);
    }
    setExpandedNestedProcess(newExpanded);
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (process?.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Processing...';
    if (process?.error) return 'Error occurred';
    return 'Completed';
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (process?.error) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const indentClass = depth > 0 ? 'ml-0' : '';

  return (
    <div className={`space-y-4 w-full mb-6 ${indentClass}`}>
      {depth === 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="p-4">
            <div className="flex items-center gap-2 text-base font-semibold">
              {getStatusIcon()}
              <span className="text-zinc-900">Student AI Agent</span>
              <span
                className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor()}`}
              >
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
      )}

      {process?.iterationHistory.map((iteration, index) => {
        const isExpanded = expandedSteps.has(index);
        const minimisedStructuredThought = {
          ...iteration.structuredThought,
          functionCalls: (
            iteration.structuredThought.functionCalls as (
              | ToolCallWithResult
              | AgentToolCallWithResult
            )[]
          ).map((call) => ({
            ...call,
            internalRouterProcess: undefined,
          })),
        };
        return (
          <div
            key={index}
            className="rounded-lg border-l-4 border-l-blue-500 border border-zinc-200 bg-white shadow-sm"
          >
            <div
              className="cursor-pointer p-4 transition-colors hover:bg-zinc-50"
              onClick={() => toggleStep(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-full border-2 border-blue-200 bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                    {iteration.iteration}
                  </span>
                  <span className="text-sm font-medium text-zinc-600">
                    {iteration.naturalLanguageThought?.substring(0, 100)}
                    {iteration.naturalLanguageThought?.length > 100
                      ? '...'
                      : ''}
                  </span>
                </div>
                <button className="p-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
              <div className="space-y-4 border-t border-zinc-200 p-4 pt-4">
                {/* Natural Language Thought */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-purple-500" />
                    <h4 className="text-sm font-semibold text-purple-700">
                      Natural Language Thought
                    </h4>
                  </div>
                  <div className="rounded-md border-l-2 border-purple-200 bg-purple-50 p-3">
                    <p className="whitespace-pre-wrap text-sm text-zinc-700">
                      {iteration.naturalLanguageThought ||
                        'No thought available'}
                    </p>
                  </div>
                </div>

                {/* Todo List */}
                {iteration.todoThought && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">✅</span>
                      <h4 className="text-sm font-semibold text-orange-700">
                        Todo List
                      </h4>
                    </div>
                    <div className="rounded-md border-l-2 border-orange-200 bg-orange-50 p-3">
                      <p className="whitespace-pre-wrap text-sm text-zinc-700">
                        {iteration.todoThought}
                      </p>
                    </div>
                  </div>
                )}

                {/* Structured Thought (JSON) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-blue-700">
                      Structured Thought (JSON)
                    </h4>
                  </div>
                  <div className="rounded-md border-l-2 border-blue-200 bg-blue-50 p-3">
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-zinc-700">
                      {minimisedStructuredThought
                        ? JSON.stringify(minimisedStructuredThought, null, 2)
                        : 'No structured thought available'}
                    </pre>
                  </div>
                </div>

                {/* Function Calls */}
                {iteration.structuredThought?.functionCalls &&
                  iteration.structuredThought.functionCalls.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-green-500" />
                        <h4 className="text-sm font-semibold text-green-700">
                          Function Calls
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {(
                          iteration.structuredThought.functionCalls as (
                            | ToolCallWithResult
                            | AgentToolCallWithResult
                          )[]
                        ).map((call, callIndex: number) => {
                          const nestedId = `${index}-${callIndex}`;
                          const isAgentCall = isAgentToolCall(call);
                          const isNestedExpanded =
                            expandedNestedProcess.has(nestedId);

                          return (
                            <div
                              key={callIndex}
                              className={`rounded-md border-l-2 p-3 ${
                                isAgentCall
                                  ? 'border-purple-200 bg-purple-50'
                                  : 'border-green-200 bg-green-50'
                              } ${
                                isAgentCall
                                  ? 'cursor-pointer transition-colors hover:bg-purple-100'
                                  : ''
                              }`}
                              onClick={() =>
                                isAgentCall && toggleNestedProcess(nestedId)
                              }
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isAgentCall && (
                                    <span className="text-xs font-semibold text-purple-600">
                                      🤖 AGENT
                                    </span>
                                  )}
                                  <span
                                    className={`font-mono text-sm font-semibold ${
                                      isAgentCall
                                        ? 'text-purple-800'
                                        : 'text-green-800'
                                    }`}
                                  >
                                    {call.function}
                                  </span>
                                </div>
                                {isAgentCall && (
                                  <div className="text-purple-600">
                                    {isNestedExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Arguments */}
                              {call.args && (
                                <div
                                  className="mt-2 text-xs text-zinc-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <strong>Arguments:</strong>
                                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">
                                    {typeof call.args === 'string'
                                      ? call.args
                                      : JSON.stringify(call.args, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {/* Result for non-agent calls */}
                              {!isAgentCall && call.result && (
                                <div
                                  className="mt-2 text-xs text-zinc-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <strong>Result:</strong>
                                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">
                                    {typeof call.result === 'string'
                                      ? call.result
                                      : JSON.stringify(call.result, null, 2)}
                                  </pre>
                                </div>
                              )}

                              {/* Nested Internal Router Process for Agent Calls */}
                              {isAgentCall &&
                                isNestedExpanded &&
                                call.type === 'agent' && (
                                  <div
                                    className="mt-3 border-l-4 border-purple-300 pl-4"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="mb-2 text-xs font-semibold text-purple-700">
                                      Internal Agent Process:
                                    </div>
                                    <ProcessViewer
                                      process={
                                        call.internalRouterProcess as RouterProcess
                                      }
                                      isLoading={false}
                                      depth={depth + 1}
                                    />
                                  </div>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        );
      })}

      {/* Error Display */}
      {process?.error && (
        <div className="rounded-lg border-l-4 border-l-red-500 border border-zinc-200 bg-white shadow-sm">
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-base font-semibold">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-zinc-900">Error</span>
            </div>
            <div className="rounded-md border-l-2 border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{process.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isLoading && (!process || process.iterationHistory.length === 0) && (
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-center gap-3 py-8 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Waiting for AI to start processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};
