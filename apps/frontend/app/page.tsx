'use client';

import React, { useState, useEffect } from 'react';
import { ChatMessage } from './components/types';
import { useSettings } from './components/useSettings';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { safeValidateApiResponse } from './lib/validation';
import { useChatStorage } from './lib/useChatStorage';
import { ChatHistory } from './components/ChatHistory';

export default function Home() {
  const {
    sessions,
    currentSession,
    addMessage,
    clearCurrentSession,
    switchSession,
    deleteSession,
    createNewSession,
  } = useChatStorage();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings, updateSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  // Ensure we have a current session
  useEffect(() => {
    if (!currentSession && sessions.length === 0) {
      createNewSession();
    }
  }, [currentSession, sessions.length, createNewSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setError(null);
    setLoading(true);

    // Create user message with proper content structure
    const userMessage: ChatMessage = {
      role: 'user',
      content: {
        friendlyResponse: input,
      },
    };
    addMessage(userMessage);
    setInput('');

    try {
      const res = await fetch('http://localhost:3000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          ...settings,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response from agent');

      const data = await res.json();
      const validatedResponse = safeValidateApiResponse(data);

      if (!validatedResponse) {
        throw new Error('Invalid response format from server');
      }

      addMessage({ role: 'assistant', content: validatedResponse });
    } catch (err: unknown) {
      // Create error message with proper content structure
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: {
          friendlyResponse: 'Sorry, there was an error. Please try again.',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      };
      addMessage(errorMessage);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-lg flex overflow-hidden border border-gray-200">
        <ChatHistory
          sessions={sessions}
          currentSessionId={currentSession?.id || ''}
          onNewChat={createNewSession}
          onSelectChat={switchSession}
          onDeleteChat={deleteSession}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            onOpenSettings={() => setShowSettings(true)}
            router={settings.router}
            onClearChat={clearCurrentSession}
          />

          {showSettings && (
            <SettingsModal
              settings={settings}
              onUpdateSettings={updateSettings}
              onClose={() => setShowSettings(false)}
            />
          )}

          <ChatMessages
            messages={currentSession?.messages || []}
            loading={loading}
          />

          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            loading={loading}
          />

          {error && (
            <div className="text-red-500 text-xs text-center pb-2">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
