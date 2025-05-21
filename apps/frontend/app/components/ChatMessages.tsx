import { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './types';
import { safeValidateApiResponse } from '../lib/validation';

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
}

export function ChatMessages({ messages, loading }: ChatMessagesProps) {
  const chatRef = useRef<HTMLDivElement>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<number[]>([]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const toggleThought = (index: number) => {
    setExpandedThoughts((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <main
      ref={chatRef}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50"
    >
      <div className="flex flex-col gap-2">
        {messages.map((msg, idx) => {
          // For user messages, we know the content structure is simple
          if (msg.role === 'user') {
            return (
              <div key={idx} className="flex flex-col gap-2">
                <div className="self-end bg-primary text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[80%] whitespace-pre-line">
                  {msg.content.friendlyResponse}
                </div>
              </div>
            );
          }

          // For assistant messages, validate the content
          const validatedContent = safeValidateApiResponse(msg.content);
          if (!validatedContent) {
            console.error('Invalid message content:', msg.content);
            return (
              <div key={idx} className="flex flex-col gap-2">
                <div className="self-start bg-gray-200 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%] whitespace-pre-line">
                  {msg.content.friendlyResponse}
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex flex-col gap-2">
              <div className="self-start bg-gray-200 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%] whitespace-pre-line">
                {validatedContent.friendlyResponse}
              </div>
              {validatedContent.error && (
                <div className="self-start text-red-500 text-sm mt-1">
                  {validatedContent.error}
                </div>
              )}
              {validatedContent.process?.iterationHistory &&
                msg.role === 'assistant' && (
                  <div className="self-start max-w-[80%]">
                    <button
                      onClick={() => toggleThought(idx)}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 transition-transform ${
                          expandedThoughts.includes(idx) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      {expandedThoughts.includes(idx) ? 'Hide' : 'Show'} Details
                    </button>
                    {expandedThoughts.includes(idx) && (
                      <div className="mt-2 bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                        <div className="text-sm text-gray-500 mb-2">
                          Question: {validatedContent.process.question}
                        </div>
                        {validatedContent.process.iterationHistory.map(
                          (iteration, iterIdx) => (
                            <div
                              key={iterIdx}
                              className="space-y-2 border-b border-gray-100 pb-3 last:border-0"
                            >
                              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2">
                                  <div className="bg-white text-gray-900 px-3 py-1.5 rounded-md text-base font-medium">
                                    Step {iteration.iteration}
                                  </div>
                                  {iteration.isFinished && (
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                      Completed
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Iteration {iteration.iteration} of{' '}
                                  {validatedContent.process?.iterationHistory
                                    ?.length ?? '?'}
                                </div>
                              </div>
                              <div className="space-y-2">
                                {/* Thought Section */}
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700">
                                    Thought:
                                  </h5>
                                  <p className="text-gray-600 text-sm mt-1">
                                    {iteration.thought}
                                  </p>
                                </div>

                                {/* Function Calls Section */}
                                <div className="space-y-3">
                                  <h5 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    Agent Calls
                                  </h5>
                                  {iteration.agentCalls &&
                                  iteration.agentCalls.length > 0 ? (
                                    <div className="space-y-3">
                                      {iteration.agentCalls.map(
                                        (call, callIdx) => (
                                          <div
                                            key={callIdx}
                                            className="bg-gray-50 rounded-lg p-4 text-sm border border-gray-100"
                                          >
                                            <div className="font-medium text-gray-900 mb-2">
                                              {call.agentName}
                                            </div>
                                            {call.functionsToCall &&
                                              call.functionsToCall.length >
                                                0 && (
                                                <div className="mt-3 space-y-3">
                                                  {call.functionsToCall.map(
                                                    (func, funcIdx) => (
                                                      <div
                                                        key={funcIdx}
                                                        className="border-l-2 border-primary/20 pl-4"
                                                      >
                                                        <div className="text-gray-800 font-medium">
                                                          {func.functionName}
                                                        </div>
                                                        <div className="text-gray-600 text-sm mt-1">
                                                          {func.description}
                                                        </div>
                                                        {func.parameters &&
                                                          Object.keys(
                                                            func.parameters,
                                                          ).length > 0 && (
                                                            <div className="mt-3">
                                                              <div className="text-gray-700 text-sm font-medium">
                                                                Parameters:
                                                              </div>
                                                              <pre className="mt-2 text-sm bg-gray-100 p-3 rounded-lg overflow-x-auto border border-gray-200">
                                                                {JSON.stringify(
                                                                  func.parameters,
                                                                  null,
                                                                  2,
                                                                )}
                                                              </pre>
                                                            </div>
                                                          )}
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              )}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-gray-500 text-sm bg-gray-50 rounded-lg p-3 border border-gray-100">
                                      No agent calls in this step
                                    </div>
                                  )}
                                </div>

                                {/* Observe Section */}
                                <div className="space-y-3">
                                  <h5 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
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
                                    Observe
                                  </h5>
                                  {iteration.summary ? (
                                    <div className="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-100">
                                      {iteration.summary}
                                    </div>
                                  ) : (
                                    <div className="text-gray-500 text-sm bg-gray-50 rounded-lg p-3 border border-gray-100">
                                      No observations in this step
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}
            </div>
          );
        })}
        {loading && (
          <div className="self-start bg-gray-200 text-gray-400 px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%]">
            <span className="loading-dots">Thinking</span>
            <style jsx>{`
              .loading-dots::after {
                content: '';
                animation: dots 1.5s steps(4, end) infinite;
              }
              @keyframes dots {
                0%,
                20% {
                  content: '';
                }
                40% {
                  content: '.';
                }
                60% {
                  content: '..';
                }
                80%,
                100% {
                  content: '...';
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </main>
  );
}
