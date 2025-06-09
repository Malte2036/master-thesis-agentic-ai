'use client';

import React, { useState } from 'react';
import { Settings } from './components/types';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { ChatHistory } from './components/ChatHistory';
import { askRoutingAgent } from './lib/routingApi';
import { MOCK_SESSIONS, MOCK_SETTINGS } from './lib/mockData';
import { ChatSession } from './lib/mockData';

export default function Home() {
  const [sessions] = useState(MOCK_SESSIONS);
  const [currentSessionId, setCurrentSessionId] = useState(MOCK_SESSIONS[0].id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>(MOCK_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const currentSession = sessions.find(
    (s: ChatSession) => s.id === currentSessionId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setInput('');

    const response = await askRoutingAgent(
      input,
      settings.router,
      settings.max_iterations,
      settings.model,
    ).catch((error) => {
      console.error(error);
      setLoading(false);
    });

    console.log(response);

    setLoading(false);
  };

  const handleNewChat = () => {
    // Just switch to first session for UI demo
    setCurrentSessionId(sessions[0].id);
  };

  const handleSelectChat = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleDeleteChat = (sessionId: string) => {
    // For UI demo, just switch to another session if current is deleted
    if (sessionId === currentSessionId) {
      const otherSession = sessions.find(
        (s: ChatSession) => s.id !== sessionId,
      );
      if (otherSession) {
        setCurrentSessionId(otherSession.id);
      }
    }
  };

  const handleClearChat = () => {
    // For UI demo, just switch to first session
    setCurrentSessionId(sessions[0].id);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-lg flex overflow-hidden border border-gray-200">
        <ChatHistory
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <ChatHeader
            onOpenSettings={() => setShowSettings(true)}
            router={settings.router}
            onClearChat={handleClearChat}
          />

          {showSettings && (
            <SettingsModal
              settings={settings}
              onUpdateSettings={setSettings}
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
        </div>
      </div>
    </div>
  );
}
