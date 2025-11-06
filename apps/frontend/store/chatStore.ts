import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RouterProcess } from '@master-thesis-agentic-ai/types';

export type ChatMessage = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
  process?: RouterProcess;
};

export type ChatConversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};

type ChatStore = {
  conversations: ChatConversation[];
  currentConversationId: string | null;

  // Actions
  createConversation: (firstMessage: string) => string;
  addMessage: (
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'timestamp'>,
  ) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  deleteConversation: (conversationId: string) => void;

  // Selectors
  getCurrentConversation: () => ChatConversation | null;
};

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const generateTitleFromMessage = (message: string): string => {
  // Take first 50 characters of the message as title
  const title = message.trim().slice(0, 50);
  return title.length < message.trim().length ? `${title}...` : title;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,

      createConversation: (firstMessage) => {
        const id = generateId();
        const title = generateTitleFromMessage(firstMessage);

        const newConversation: ChatConversation = {
          id,
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }));

        return id;
      },

      addMessage: (conversationId, message) => {
        const messageId = generateId();
        const timestamp = Date.now();

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    { id: messageId, timestamp, ...message },
                  ],
                  updatedAt: timestamp,
                }
              : conv,
          ),
        }));
      },

      setCurrentConversation: (conversationId) => {
        set({ currentConversationId: conversationId });
      },

      deleteConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.filter(
            (conv) => conv.id !== conversationId,
          ),
          currentConversationId:
            state.currentConversationId === conversationId
              ? null
              : state.currentConversationId,
        }));
      },

      getCurrentConversation: () => {
        const state = get();
        if (!state.currentConversationId) return null;
        return (
          state.conversations.find(
            (conv) => conv.id === state.currentConversationId,
          ) || null
        );
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
