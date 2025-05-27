import { Brain, ChevronRight, Target, Zap } from 'lucide-react';
import { JsonDisplay } from '../JsonDisplay';
import { RouterProcess } from '@master-thesis-agentic-rag/types';

interface ProcessDisplayProps {
  process: RouterProcess | undefined;
  showProcess: boolean;
  onToggleProcess: () => void;
}

export function ProcessDisplay({
  process,
  showProcess,
  onToggleProcess,
}: ProcessDisplayProps) {
  if (!process?.iterationHistory) return null;

  return (
    <div className="mt-3">
      <button
        onClick={onToggleProcess}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all duration-200 shadow-sm"
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform duration-200 ${showProcess ? 'rotate-90' : ''}`}
        />
        <Brain className="w-4 h-4" />
        <span className="font-medium">KI-Prozess anzeigen</span>
        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
          {process.iterationHistory.length} Iterationen
        </span>
      </button>

      {showProcess && (
        <div className="mt-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-600" />
              Verarbeitete Anfrage: &ldquo;{process.question}&rdquo;
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Maximale Iterationen: {process.maxIterations}
            </p>
          </div>

          <div className="space-y-4">
            {process.iterationHistory.map((iteration, index) => (
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

                  {iteration.agentCalls && iteration.agentCalls.length > 0 && (
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
                            {} as Record<string, typeof iteration.agentCalls>,
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
                              {calls.map((call, callIndex) => (
                                <div
                                  key={callIndex}
                                  className="mt-3 first:mt-0 bg-white rounded-lg p-3 border border-gray-100"
                                >
                                  <h6 className="text-sm font-medium text-gray-900 mb-1">
                                    {call.function}
                                  </h6>
                                  {call.args &&
                                    Object.keys(call.args).length > 0 && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-700 mb-1">
                                          Parameter:
                                        </p>
                                        <div className="bg-gray-50 p-3 rounded-md border border-gray-100 font-mono">
                                          <JsonDisplay data={call.args} />
                                        </div>
                                      </div>
                                    )}
                                </div>
                              ))}
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
                    <p className="text-sm text-gray-600">{iteration.summary}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
