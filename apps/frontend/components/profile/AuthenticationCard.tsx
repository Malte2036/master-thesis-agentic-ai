'use client';

import { Button } from '@/components/button/Button';
import { getMcpServiceAuthUrl, McpServiceName } from '@/lib/api/mcp';
import { useMcpStore } from '@/store/mcpStore';
import { CheckCircle } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { MoodleAuthDialog } from './MoodleAuthDialog';
import { useState } from 'react';

type AuthenticationCardProps = {
  provider: McpServiceName;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
};

export const AuthenticationCard = ({
  provider,
  title,
  description,
  icon: Icon,
  iconColor,
}: AuthenticationCardProps) => {
  const refreshToken = useMcpStore((state) => state.refreshTokens[provider]);
  const isConnected = !!refreshToken;
  const [isMoodleDialogOpen, setIsMoodleDialogOpen] = useState(false);

  const handleConnect = () => {
    if (provider === 'moodle') {
      // Open dialog for Moodle
      setIsMoodleDialogOpen(true);
    } else {
      // OAuth flow for calendar
      const authUrl = getMcpServiceAuthUrl(provider);
      window.open(authUrl.toString(), '_blank');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
        <div className="flex items-center space-x-4">
          <div
            className={`w-12 h-12 ${iconColor} rounded-lg flex items-center justify-center text-white`}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-900">{title}</h3>
              {isConnected && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Connected</span>
                </div>
              )}
            </div>
            <p className="text-sm text-zinc-500">{description}</p>
          </div>
        </div>
        <Button onClick={handleConnect}>
          {isConnected ? 'Reconnect' : 'Connect'}
        </Button>
      </div>

      {provider === 'moodle' && (
        <MoodleAuthDialog
          isOpen={isMoodleDialogOpen}
          onClose={() => setIsMoodleDialogOpen(false)}
        />
      )}
    </>
  );
};
