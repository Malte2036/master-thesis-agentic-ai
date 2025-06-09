import { Menu, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { RouterResponseWithId } from '../lib/types';

interface ChatHistoryProps {
  sessions: RouterResponseWithId[];
  currentSessionId: string | undefined;
  onNewChat: () => void;
  onSelectChat: (sessionId: string) => void;
  onDeleteChat: (sessionId: string) => void;
}

export function ChatHistory({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: ChatHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  // const formatDate = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toLocaleString('en-US', {
  //     month: 'short',
  //     day: 'numeric',
  //     hour: 'numeric',
  //     minute: 'numeric',
  //     hour12: true,
  //   });
  // };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => {
              onNewChat();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((session) => (
            <div
              key={session._id}
              className={`group relative flex items-center space-x-2 p-2 rounded-lg cursor-pointer mb-1 ${
                session._id === currentSessionId
                  ? 'bg-red-50 text-red-700'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => {
                onSelectChat(session._id);
                setIsOpen(false);
              }}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {session.process?.question || 'No question'}
                </div>
                {/* <div className="text-xs text-gray-500">
                  {formatDate(session.createdAt)}
                </div> */}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(session._id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
