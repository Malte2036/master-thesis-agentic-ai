import { useState, useEffect } from 'react';
import { ChatMessage } from '../components/types';

const CHAT_STORAGE_KEY = 'hsd-chat-history';

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const createEmptySession = (): ChatSession => ({
  id: crypto.randomUUID(),
  title: 'New Chat',
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export function useChatStorage() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      const savedSessions = localStorage.getItem(CHAT_STORAGE_KEY);
      if (savedSessions) {
        try {
          const parsed = JSON.parse(savedSessions);
          return parsed.length > 0 ? parsed : [createEmptySession()];
        } catch (error) {
          console.error('Error parsing saved sessions:', error);
          return [createEmptySession()];
        }
      }
    }
    return [createEmptySession()];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || '';
  });

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const getCurrentSession = () => {
    const session = sessions.find((session) => session.id === currentSessionId);
    if (!session) {
      const newSession = createEmptySession();
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      return newSession;
    }
    return session;
  };

  const createNewSession = () => {
    const newSession = createEmptySession();
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const addMessage = (message: ChatMessage) => {
    setSessions((prev) => {
      const currentSession = prev.find((s) => s.id === currentSessionId);
      if (!currentSession) {
        const newSession = createEmptySession();
        return [{ ...newSession, messages: [message] }, ...prev];
      }

      // Update session title based on first user message
      if (message.role === 'user' && currentSession.messages.length === 0) {
        currentSession.title =
          message.content.friendlyResponse.slice(0, 30) + '...';
      }

      return prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [...s.messages, message],
              updatedAt: new Date().toISOString(),
            }
          : s,
      );
    });
  };

  const clearCurrentSession = () => {
    setSessions((prev) => {
      const newSessions = prev.filter((s) => s.id !== currentSessionId);
      if (newSessions.length === 0) {
        const newSession = createEmptySession();
        setCurrentSessionId(newSession.id);
        return [newSession];
      }
      setCurrentSessionId(newSessions[0].id);
      return newSessions;
    });
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const newSessions = prev.filter((s) => s.id !== sessionId);
      if (newSessions.length === 0) {
        const newSession = createEmptySession();
        setCurrentSessionId(newSession.id);
        return [newSession];
      }
      if (sessionId === currentSessionId) {
        setCurrentSessionId(newSessions[0].id);
      }
      return newSessions;
    });
  };

  return {
    sessions,
    currentSession: getCurrentSession(),
    addMessage,
    clearCurrentSession,
    switchSession,
    deleteSession,
    createNewSession,
  };
}
