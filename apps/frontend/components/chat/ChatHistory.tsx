'use client';

import { useChatStore } from '@/store/chatStore';
import { MessageSquare, Plus, Trash2, MoreVertical } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type Props = {
  onClose?: () => void;
};

export const ChatHistory = ({ onClose }: Props) => {
  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    deleteConversation,
  } = useChatStore();

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter conversations with messages
  const conversationsWithMessages = conversations.filter(
    (conv) => conv.messages.length > 0,
  );

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  const handleNewChat = () => {
    setCurrentConversation(null);
    onClose?.();
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversation(conversationId);
    onClose?.();
  };

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversationId);
      setMenuOpen(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-zinc-200 p-4">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-3 rounded-lg bg-red-600 px-4 py-3 text-white transition-colors hover:bg-red-700"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversationsWithMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-3 h-12 w-12 text-zinc-300" />
            <p className="text-sm text-zinc-500">No conversations yet</p>
            <p className="mt-1 text-xs text-zinc-400">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversationsWithMessages.map((conversation) => (
              <div
                key={conversation.id}
                className={`group relative rounded-lg transition-colors ${
                  conversation.id === currentConversationId
                    ? 'bg-red-50'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <button
                  onClick={() => handleSelectConversation(conversation.id)}
                  className="flex w-full items-start gap-3 p-3 text-left"
                >
                  <MessageSquare
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      conversation.id === currentConversationId
                        ? 'text-red-600'
                        : 'text-zinc-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`truncate text-sm font-medium ${
                        conversation.id === currentConversationId
                          ? 'text-red-600'
                          : 'text-zinc-900'
                      }`}
                    >
                      {conversation.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatDate(conversation.updatedAt)} •{' '}
                      {conversation.messages.length} messages
                    </p>
                  </div>
                </button>

                {/* Context Menu */}
                <div className="absolute right-2 top-2" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(
                        menuOpen === conversation.id ? null : conversation.id
                      );
                    }}
                    className="rounded p-1 opacity-0 transition-opacity hover:bg-zinc-200 group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4 text-zinc-600" />
                  </button>

                  {menuOpen === conversation.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-zinc-200 bg-white shadow-lg">
                      <button
                        onClick={(e) =>
                          handleDeleteConversation(conversation.id, e)
                        }
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

