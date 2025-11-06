'use client';

import { ChatWindow } from '@/components/chat/ChatWindow';
import { Navigation } from '@/components/navigation/Navigation';

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  );
}
