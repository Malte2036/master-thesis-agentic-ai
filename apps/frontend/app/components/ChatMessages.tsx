import { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './types';
import { safeValidateApiResponse } from '../lib/validation';
import {
  Bot,
  User,
  Brain,
  ChevronRight,
  Target,
  Zap,
  AlertCircle,
} from 'lucide-react';

type JsonValue = string | number | boolean | null | JsonObject;
interface JsonObject {
  [key: string]: JsonValue;
}

interface JsonDisplayProps {
  data: {
    [key: string]: unknown;
  };
}

function JsonDisplay({ data }: JsonDisplayProps) {
  return (
    <div className="text-xs">
      {'{'}
      {Object.entries(data).map(([key, value], index, array) => (
        <div key={key} className="ml-4">
          <span className="text-blue-600">{`"${key}"`}</span>
          <span className="text-gray-600">: </span>
          <span className="text-gray-800">
            {typeof value === 'object' && value !== null
              ? JSON.stringify(value, null, 2)
              : typeof value === 'string'
                ? `"${value}"`
                : String(value)}
          </span>
          {index < array.length - 1 && <span className="text-gray-600">,</span>}
        </div>
      ))}
      {'}'}
    </div>
  );
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
}

export function ChatMessages({ messages, loading }: ChatMessagesProps) {
  const chatRef = useRef<HTMLDivElement>(null);
  const [showProcess, setShowProcess] = useState<{ [key: number]: boolean }>(
    {},
  );

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const toggleProcess = (messageIndex: number) => {
    setShowProcess((prev) => ({
      ...prev,
      [messageIndex]: !prev[messageIndex],
    }));
  };

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
              <div key={idx} className="flex justify-end mr-16">
                <div className="flex items-end space-x-3 group">
                  <div className="flex-1 text-right">
                    {/* Message Header */}
                    <div className="flex items-center space-x-2 mb-2 justify-end">
                      <span className="text-sm font-medium text-gray-700">
                        You
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className="prose prose-sm max-w-none p-5 shadow-sm bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 rounded-2xl rounded-br-md border border-slate-300">
                      <div className="whitespace-pre-line leading-relaxed font-medium">
                        {msg.content.friendlyResponse}
                      </div>
                    </div>
                  </div>

                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 mb-1">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            );
          }

          // For assistant messages, validate the content
          const validatedContent = safeValidateApiResponse(msg.content);
          if (!validatedContent) {
            console.error('Invalid message content:', msg.content);
            return (
              <div key={idx} className="flex justify-start ml-16">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 mb-1">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    {/* Message Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        HSD Assistant
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className="prose prose-sm max-w-none p-5 shadow-sm bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md">
                      <div className="whitespace-pre-line leading-relaxed font-medium">
                        {msg.content.friendlyResponse}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={idx} className="flex justify-start ml-16">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 mb-1">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  {/* Message Header */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      HSD Assistant
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="prose prose-sm max-w-none p-5 shadow-sm bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md">
                    <div className="whitespace-pre-line leading-relaxed font-medium">
                      {validatedContent.friendlyResponse}
                    </div>
                  </div>

                  {/* Error Message */}
                  {validatedContent.error && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-red-800 mb-1">
                            Es gab ein Problem
                          </h4>
                          <p className="text-sm text-red-700">
                            {validatedContent.error}
                          </p>
                          <div className="mt-2 text-xs text-red-600">
                            Bitte versuche es erneut oder kontaktiere den
                            Support, wenn das Problem weiterhin besteht.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Agent Process */}
                  {validatedContent.process?.iterationHistory && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleProcess(idx)}
                        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all duration-200 shadow-sm"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${showProcess[idx] ? 'rotate-90' : ''}`}
                        />
                        <Brain className="w-4 h-4" />
                        <span className="font-medium">KI-Prozess anzeigen</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {validatedContent.process.iterationHistory.length}{' '}
                          Iterationen
                        </span>
                      </button>

                      {/* Detailed Process View */}
                      {showProcess[idx] && (
                        <div className="mt-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 p-6 shadow-sm">
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-800 flex items-center">
                              <Target className="w-4 h-4 mr-2 text-blue-600" />
                              Verarbeitete Anfrage: &ldquo;
                              {validatedContent.process.question}&rdquo;
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Maximale Iterationen:{' '}
                              {validatedContent.process.maxIterations}
                            </p>
                          </div>

                          {validatedContent.process.iterationHistory && (
                            <div className="space-y-4">
                              {validatedContent.process.iterationHistory.map(
                                (iteration, index) => (
                                  <div
                                    key={index}
                                    className="bg-white rounded-lg p-4 border border-gray-200"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                          {iteration.iteration}
                                        </div>
                                        <span className="font-medium text-gray-800">
                                          Iteration {iteration.iteration}
                                        </span>
                                        {iteration.isFinished && (
                                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                            Abgeschlossen
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                                          Gedankengang:
                                        </h5>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap break-words">
                                          {iteration.thought}
                                        </p>
                                      </div>

                                      {iteration.agentCalls &&
                                        iteration.agentCalls.length > 0 && (
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                              <Zap className="w-4 h-4 mr-1" />
                                              Agent-Aufrufe:
                                            </h5>
                                            <div className="space-y-3">
                                              {Object.entries(
                                                iteration.agentCalls.reduce(
                                                  (acc, call) => {
                                                    if (!acc[call.agent]) {
                                                      acc[call.agent] = [];
                                                    }
                                                    acc[call.agent].push(call);
                                                    return acc;
                                                  },
                                                  {} as Record<
                                                    string,
                                                    typeof iteration.agentCalls
                                                  >,
                                                ),
                                              ).map(([agentName, calls]) => (
                                                <div
                                                  key={agentName}
                                                  className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-blue-100"
                                                >
                                                  <div className="flex items-center space-x-2 mb-3">
                                                    <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                                                      {agentName}
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                      {calls.length} Funktionen
                                                    </span>
                                                  </div>
                                                  <div className="space-y-3">
                                                    {calls.map(
                                                      (call, callIndex) => (
                                                        <div
                                                          key={callIndex}
                                                          className="mt-3 first:mt-0 bg-white rounded-lg p-3 border border-gray-100"
                                                        >
                                                          <h6 className="text-sm font-medium text-gray-900 mb-1">
                                                            {call.function}
                                                          </h6>
                                                          {call.args &&
                                                            Object.keys(
                                                              call.args,
                                                            ).length > 0 && (
                                                              <div className="mt-2">
                                                                <p className="text-xs font-medium text-gray-700 mb-1">
                                                                  Parameter:
                                                                </p>
                                                                <div className="bg-gray-50 p-3 rounded-md border border-gray-100 font-mono">
                                                                  <JsonDisplay
                                                                    data={
                                                                      call.args
                                                                    }
                                                                  />
                                                                </div>
                                                              </div>
                                                            )}
                                                        </div>
                                                      ),
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                      <div>
                                        <h5 className="text-sm font-medium text-gray-700 mb-1">
                                          Zusammenfassung:
                                        </h5>
                                        <p className="text-sm text-gray-600">
                                          {iteration.summary}
                                        </p>
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
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start ml-16">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-200 flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span className="text-gray-700 font-medium">
                  Verarbeite deine Anfrage...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
