import { Settings, Activity, MessageCircle, Trash2 } from 'lucide-react';

interface ChatHeaderProps {
  onOpenSettings: () => void;
  router: 'legacy' | 'react';
  onClearChat: () => void;
}

export function ChatHeader({
  onOpenSettings,
  router,
  onClearChat,
}: ChatHeaderProps) {
  const getRouterColor = (type: 'legacy' | 'react') => {
    switch (type) {
      case 'react':
        return 'bg-red-50 border-red-100 text-red-700';
      case 'legacy':
        return 'bg-purple-50 border-purple-100 text-purple-700';
      default:
        return 'bg-red-50 border-red-100 text-red-700';
    }
  };

  const getRouterLabel = (type: 'legacy' | 'react') => {
    switch (type) {
      case 'react':
        return 'ReAct Router';
      case 'legacy':
        return 'Legacy Router';
      default:
        return 'Unknown Router';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                HSD AI Assistant
              </h1>
              <p className="text-sm text-gray-600">
                Hochschule Düsseldorf • Intelligent Support System
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${getRouterColor(router)}`}
            >
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">
                {getRouterLabel(router)}
              </span>
            </div>
            <button
              onClick={onClearChat}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
