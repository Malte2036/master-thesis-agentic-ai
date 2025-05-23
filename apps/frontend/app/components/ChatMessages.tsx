import { useRef, useEffect } from 'react';
import { ChatMessage } from './types';
import { safeValidateApiResponse } from '../lib/validation';

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
}

export function ChatMessages({ messages, loading }: ChatMessagesProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <main
      ref={chatRef}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50"
    >
      <div className="flex flex-col gap-4">
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
            <div key={idx} className="flex flex-col gap-3">
              {/* Main Response */}
              <div className="self-start bg-white text-gray-900 px-4 py-3 rounded-2xl rounded-bl-none max-w-[80%] shadow-sm border border-gray-100">
                <div className="whitespace-pre-line">
                  {validatedContent.friendlyResponse}
                </div>
              </div>

              {/* Error Message */}
              {validatedContent.error && (
                <div className="self-start text-red-500 text-sm mt-1">
                  {validatedContent.error}
                </div>
              )}

              {/* Agent Process */}
              {validatedContent.process?.iterationHistory &&
                msg.role === 'assistant' && (
                  <div className="self-start max-w-[80%] space-y-3">
                    {validatedContent.process.iterationHistory.map(
                      (iteration, iterIdx) => (
                        <div
                          key={iterIdx}
                          className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                          {/* Step Header */}
                          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-2.5 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-sm font-medium">
                                  Step {iteration.iteration}
                                </span>
                                {iteration.isFinished && (
                                  <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-medium">
                                    Completed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 space-y-4">
                            {/* Thought */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="w-4 h-4 text-slate-500"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 3a7 7 0 100 14 7 7 0 000-14zM6.39 6.39a.75.75 0 011.064-1.064l1.494 1.494a.75.75 0 01.21 1.285l-2.28 1.71a.75.75 0 01-1.022-.24l-.75-1.5a.75.75 0 01.22-.986l1.058-.7zM13.61 6.39a.75.75 0 00-1.064-1.064L11.052 6.82a.75.75 0 00-.21 1.285l2.28 1.71a.75.75 0 001.022-.24l.75-1.5a.75.75 0 00-.22-.986l-1.058-.7zM9.25 12a.75.75 0 01.75-.75h0a.75.75 0 01.75.75v2.25a.75.75 0 01-.75.75h0a.75.75 0 01-.75-.75V12z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Thought
                              </div>
                              <p className="text-slate-600 text-sm pl-6 whitespace-pre-line">
                                {iteration.thought}
                              </p>
                            </div>

                            {/* Agent Calls */}
                            {iteration.agentCalls &&
                              iteration.agentCalls.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4 text-slate-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    Actions
                                  </div>
                                  <div className="pl-6 space-y-3">
                                    {iteration.agentCalls.map(
                                      (call, callIdx) => (
                                        <div
                                          key={callIdx}
                                          className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                                        >
                                          <div className="font-medium text-slate-800 mb-2">
                                            {call.agentName}
                                          </div>
                                          {call.functionsToCall &&
                                            call.functionsToCall.length > 0 && (
                                              <div className="space-y-2">
                                                {call.functionsToCall.map(
                                                  (func, funcIdx) => (
                                                    <div
                                                      key={funcIdx}
                                                      className="border-l-2 border-primary/30 pl-3"
                                                    >
                                                      <div className="text-slate-700 font-medium">
                                                        {func.functionName}
                                                      </div>
                                                      <div className="text-slate-500 text-xs mt-0.5">
                                                        {func.description}
                                                      </div>
                                                      {func.parameters &&
                                                        Object.keys(
                                                          func.parameters,
                                                        ).length > 0 && (
                                                          <div className="mt-2">
                                                            <div className="text-slate-600 text-xs font-medium">
                                                              Parameters:
                                                            </div>
                                                            <pre className="mt-1 text-xs bg-white p-2 rounded-md overflow-x-auto border border-slate-200">
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
                                </div>
                              )}

                            {/* Observation */}
                            {iteration.summary && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-sky-700">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-4 h-4 text-sky-500"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Observation
                                </div>
                                <p className="text-sky-600 text-sm pl-6 whitespace-pre-line">
                                  {iteration.summary}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
            </div>
          );
        })}
        {loading && (
          <div className="self-start bg-white text-gray-400 px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%] shadow-sm border border-gray-100">
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
