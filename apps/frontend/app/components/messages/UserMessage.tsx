import { User } from 'lucide-react';
import { ChatMessage } from '../types';

interface UserMessageProps {
  message: ChatMessage;
  index: number;
}

export function UserMessage({ message, index }: UserMessageProps) {
  return (
    <div key={index} className="flex justify-end mr-16">
      <div className="flex items-end space-x-3 group">
        <div className="flex-1 text-right">
          <div className="flex items-center space-x-2 mb-2 justify-end">
            <span className="text-sm font-medium text-gray-700">You</span>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="prose prose-sm max-w-none px-5 shadow-sm bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 rounded-2xl rounded-br-md border border-slate-300">
            <div className="whitespace-pre-line leading-relaxed font-medium">
              {message.content.friendlyResponse}
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
