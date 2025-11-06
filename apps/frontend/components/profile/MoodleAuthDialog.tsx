'use client';

import { Button } from '@/components/button/Button';
import { authenticateMoodle } from '@/lib/api/mcp';
import { useMcpStore } from '@/store/mcpStore';
import { X } from 'lucide-react';
import { useState } from 'react';

type MoodleAuthDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const MoodleAuthDialog = ({
  isOpen,
  onClose,
}: MoodleAuthDialogProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const setRefreshToken = useMcpStore((state) => state.setRefreshToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = await authenticateMoodle(username, password);

      // Store the token
      setRefreshToken('moodle', token);

      // Close dialog and reset form
      setUsername('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-zinc-900">
            Connect to Moodle
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your Moodle username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter your Moodle password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="flex-1">
              <Button onClick={() => {}} disabled={isLoading}>
                {isLoading ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
