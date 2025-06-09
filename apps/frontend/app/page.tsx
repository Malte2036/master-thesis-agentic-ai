'use client';

import React, { useState } from 'react';
import { Settings } from './components/types';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { ChatHistory } from './components/ChatHistory';
import { askRoutingAgent } from './lib/routingApi';
import { MOCK_SETTINGS } from './lib/mockData';
import { RouterResponseWithId } from './lib/types';
import { useMongoDBRealtime } from './lib/useMongoDBRealtime';

export default function Home() {
  const { data } = useMongoDBRealtime();
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    undefined,
  );
  const [input, setInput] = useState('');
  const [settings, setSettings] = useState<Settings>(MOCK_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  const currentSession = data.find(
    (s: RouterResponseWithId) => s._id === currentSessionId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setInput('');

    const response = await askRoutingAgent(
      input,
      settings.router,
      settings.max_iterations,
      settings.model,
    ).catch((error) => {
      console.error(error);
    });

    console.log(response);
  };

  const handleNewChat = () => {
    // Just switch to first session for UI demo
    setCurrentSessionId(undefined);
  };

  const handleSelectChat = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleDeleteChat = (sessionId: string) => {
    console.log(`TODO: Delete chat ${sessionId}`);
  };

  const handleClearChat = () => {
    console.log(`TODO: Clear chat ${currentSessionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-lg flex overflow-hidden border border-gray-200">
        <ChatHistory
          sessions={data}
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

          <ChatMessages data={currentSession} />

          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
