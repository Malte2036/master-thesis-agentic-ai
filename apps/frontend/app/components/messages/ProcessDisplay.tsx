import { Brain, ChevronRight, Target } from 'lucide-react';
import { RouterResponseWithId } from '../../lib/types';

interface ProcessDisplayProps {
  data: RouterResponseWithId;
  showProcess: boolean;
  onToggleProcess: () => void;
}

export function ProcessDisplay({
  data,
  showProcess,
  onToggleProcess,
}: ProcessDisplayProps) {
  if (!data.process?.iterationHistory) return null;

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
          {data.process.iterationHistory.length} Iterationen
        </span>
      </button>

      {showProcess && (
        <div className="mt-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-600" />
              Verarbeitete Anfrage: &ldquo;{data.process.question}&rdquo;
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Maximale Iterationen: {data.process.maxIterations}
            </p>
          </div>

          <div className="space-y-4">
            {data.process.iterationHistory.map((iteration, index) => (
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
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">
                      Gedankengang:
                    </h5>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap break-words">
                      {iteration.naturalLanguageThought}
                    </p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">
                      Ergebnis:
                    </h5>
                    <p className="text-sm text-gray-600">
                      {iteration.observation}
                    </p>
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
