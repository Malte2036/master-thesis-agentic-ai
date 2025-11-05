'use client';

import { ChatWindow } from '@/components/chat/ChatWindow';

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <ChatWindow />
    </div>
  );
}
