'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationItem } from './NavigationItem';
import { MessageCircle, BarChart3, User } from 'lucide-react';

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <div className="w-16 border-r border-zinc-200 bg-white">
      <nav className="flex h-full flex-col justify-between items-center py-4">
        <div className="flex flex-col items-center gap-4">
          <NavigationItem
            href="/"
            title="Chat"
            icon={<MessageCircle className="h-6 w-6" />}
          />
          <NavigationItem
            href="/reports"
            title="Test Reports"
            icon={<BarChart3 className="h-6 w-6" />}
          />
        </div>
        <div className="flex flex-col items-center gap-4 pb-12">
          <NavigationItem
            href="/profile"
            title="Profile"
            icon={<User className="h-6 w-6" />}
          />
        </div>
      </nav>
    </div>
  );
};
