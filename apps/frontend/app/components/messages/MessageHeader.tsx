interface MessageHeaderProps {
  aiModel?: string;
}

const getModelColor = (model: string) => {
  // Simple color mapping for UI demo
  if (model.includes('mixtral'))
    return 'bg-blue-50 text-blue-700 border-blue-200';
  if (model.includes('llama'))
    return 'bg-green-50 text-green-700 border-green-200';
  if (model.includes('qwen'))
    return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
};

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
