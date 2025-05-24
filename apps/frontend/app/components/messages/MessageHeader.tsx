import { getModelColor } from '../../lib/utils';

interface MessageHeaderProps {
  aiModel?: string;
}

export function MessageHeader({ aiModel }: MessageHeaderProps) {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <span className="text-sm font-medium text-gray-700">HSD Assistant</span>
      {aiModel && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${getModelColor(aiModel)}`}
        >
          {aiModel}
        </span>
      )}
      <span className="text-xs text-gray-500">
        {new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
}
