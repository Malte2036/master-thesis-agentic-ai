'use client';

import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { useState } from 'react';

type ProcessViewerProps = {
  process: RouterProcess | undefined;
  isLoading: boolean;
};

export const ProcessViewer = ({ process, isLoading }: ProcessViewerProps) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

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

  const getStatusIcon = () => {
    if (isLoading) {
      return (
        <svg
          className="h-4 w-4 animate-spin text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }
    if (process?.error) {
      return (
        <svg
          className="h-4 w-4 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="h-4 w-4 text-green-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    );
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

  return (
    <div className="space-y-4 w-full mb-6">
      {/* Status Header */}
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="p-4">
          <div className="flex items-center gap-2 text-base font-semibold">
            {getStatusIcon()}
            <span className="text-zinc-900 dark:text-zinc-100">
              Student AI Agent
            </span>
            <span
              className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor()}`}
            >
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      {/* Iteration Steps */}
      {process?.iterationHistory.map((iteration, index) => {
        const isExpanded = expandedSteps.has(index);
        return (
          <div
            key={index}
            className="rounded-lg border-l-4 border-l-blue-500 border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div
              className="cursor-pointer p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
              onClick={() => toggleStep(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-full border-2 border-blue-200 bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                    {iteration.iteration}
                  </span>
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {iteration.naturalLanguageThought?.substring(0, 100)}
                    {iteration.naturalLanguageThought?.length > 100
                      ? '...'
                      : ''}
                  </span>
                </div>
                <button className="p-1">
                  {isExpanded ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
              <div className="space-y-4 border-t border-zinc-200 p-4 pt-4 dark:border-zinc-700">
                {/* Natural Language Thought */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-purple-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                      Natural Language Thought
                    </h4>
                  </div>
                  <div className="rounded-md border-l-2 border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/30">
                    <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                      {iteration.naturalLanguageThought ||
                        'No thought available'}
                    </p>
                  </div>
                </div>

                {/* Structured Thought (JSON) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                    <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      Structured Thought (JSON)
                    </h4>
                  </div>
                  <div className="rounded-md border-l-2 border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-zinc-700 dark:text-zinc-300">
                      {iteration.structuredThought
                        ? JSON.stringify(iteration.structuredThought, null, 2)
                        : 'No structured thought available'}
                    </pre>
                  </div>
                </div>

                {/* Function Calls */}
                {iteration.structuredThought?.functionCalls &&
                  iteration.structuredThought.functionCalls.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <svg
                          className="h-4 w-4 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-400">
                          Function Calls
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {iteration.structuredThought.functionCalls.map(
                          (call: any, callIndex: number) => (
                            <div
                              key={callIndex}
                              className="rounded-md border-l-2 border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/30"
                            >
                              <div className="mb-2 font-mono text-sm font-semibold text-green-800 dark:text-green-300">
                                {call.name}
                              </div>
                              {call.result && (
                                <div className="text-xs text-zinc-700 dark:text-zinc-300">
                                  <strong>Result:</strong>
                                  <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">
                                    {typeof call.result === 'string'
                                      ? call.result
                                      : JSON.stringify(call.result, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ),
                        )}
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
        <div className="rounded-lg border-l-4 border-l-red-500 border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-base font-semibold">
              <svg
                className="h-4 w-4 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-zinc-900 dark:text-zinc-100">Error</span>
            </div>
            <div className="rounded-md border-l-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
              <p className="text-sm text-red-700 dark:text-red-300">
                {process.error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isLoading && (!process || process.iterationHistory.length === 0) && (
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-center gap-3 py-8 text-zinc-500 dark:text-zinc-400">
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Waiting for AI to start processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

