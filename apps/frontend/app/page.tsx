'use client';

import React, { useState } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatHistory } from './components/ChatHistory';
import { ChatInput } from './components/ChatInput';
import { ChatMessages } from './components/ChatMessages';
import { SettingsModal } from './components/SettingsModal';
import { useSettings } from './components/useSettings';
import { askRoutingAgent } from './lib/routingApi';
import { RouterResponseWithId } from './lib/types';
import { useMongoDBRealtime } from './lib/useMongoDBRealtime';

export default function Home() {
  const { data } = useMongoDBRealtime();
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
    undefined,
  );
  const [input, setInput] = useState('');
  const { settings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const currentSession = data.find(
    (s: RouterResponseWithId) => s._id === currentSessionId,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const question = input;

    try {
      const response = await askRoutingAgent(
        question,
        settings.router,
        settings.max_iterations,
        settings.model,
      );

      console.log('New chat session created:', response);

      // Immediately open the new chat session using the returned MongoDB ID
      setCurrentSessionId(response.id);
    } catch (error) {
      console.error('Error creating new chat session:', error);
      // TODO: Show error message to user
    } finally {
      setInput('');
    }
  };
  console.log(currentSession);

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
            <SettingsModal onClose={() => setShowSettings(false)} />
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
