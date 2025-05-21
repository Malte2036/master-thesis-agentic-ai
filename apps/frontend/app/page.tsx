'use client';

import React, { useState } from 'react';
import { ChatMessage, EXAMPLE_MESSAGES } from './components/types';
import { useSettings } from './components/useSettings';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';

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
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.friendlyResponse || 'No response.' },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error. Please try again.',
        },
      ]);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const displayMessages = messages.length === 0 ? EXAMPLE_MESSAGES : messages;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl h-[80vh] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden border border-gray-200">
        <ChatHeader onOpenSettings={() => setShowSettings(true)} />

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
