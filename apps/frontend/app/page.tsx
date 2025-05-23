'use client';

import React, { useState } from 'react';
import { ChatMessage, EXAMPLE_MESSAGES } from './components/types';
import { useSettings } from './components/useSettings';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { safeValidateApiResponse } from './lib/validation';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings, updateSettings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

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
    setMessages(() => [userMessage]);
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

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: validatedResponse },
      ]);
    } catch (err: unknown) {
      // Create error message with proper content structure
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: {
          friendlyResponse: 'Sorry, there was an error. Please try again.',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      };
      setMessages((prev) => [...prev, errorMessage]);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const displayMessages = messages.length === 0 ? EXAMPLE_MESSAGES : messages;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-4xl h-[90vh] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden border border-gray-200">
        <ChatHeader
          onOpenSettings={() => setShowSettings(true)}
          router={settings.router}
        />

        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={updateSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        <ChatMessages messages={displayMessages} loading={loading} />

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
  );
}
