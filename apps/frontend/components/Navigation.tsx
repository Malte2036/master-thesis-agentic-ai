'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Navigation = () => {
  const pathname = usePathname();

  return (
    <div className="w-16 border-r border-zinc-200 bg-white">
      <nav className="flex h-full flex-col items-center py-4">
        <Link
          href="/"
          className={`mb-4 rounded-lg p-3 transition-colors ${
            pathname === '/'
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'text-zinc-700 hover:bg-zinc-100'
          }`}
          title="Chat"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </Link>
        <Link
          href="/reports"
          className={`rounded-lg p-3 transition-colors ${
            pathname === '/reports'
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'text-zinc-700 hover:bg-zinc-100'
          }`}
          title="Test Reports"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </Link>
      </nav>
    </div>
  );
};

