'use client';

import { Button } from '@/components/button/Button';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, Suspense } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useMcpStore } from '@/store/mcpStore';
import { McpServiceName } from '@/lib/api/mcp';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const setRefreshToken = useMcpStore((state) => state.setRefreshToken);

  // Compute status and message directly from URL params
  const { status, provider, message } = useMemo(() => {
    const statusParam = searchParams.get('status');
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    const provider = searchParams.get('provider');
    const refreshToken = searchParams.get('refresh_token');

    if (statusParam === 'success' && refreshToken) {
      return {
        status: 'success' as const,
        message: `Successfully authenticated with ${provider || 'the service'}!`,
        provider: provider as McpServiceName,
      };
    } else if (errorParam) {
      return {
        status: 'error' as const,
        message:
          messageParam ||
          `Authentication failed: ${errorParam}. Please try again.`,
        provider: provider as McpServiceName,
      } as const;
    } else {
      return {
        status: 'error' as const,
        message:
          'Invalid callback parameters. Please try authenticating again.',
        provider: undefined,
      } as const;
    }
  }, [searchParams]);

  // Handle side effects only (logging and auto-close)
  useEffect(() => {
    const refreshToken = searchParams.get('refresh_token');

    if (status === 'success' && refreshToken) {
      // Store the refresh token in localStorage or send it to your backend
      // For now, we'll just log it
      console.log(
        'Storing refresh token for provider:',
        provider,
        refreshToken,
      );
      setRefreshToken(provider, refreshToken);

      // Auto-close the window after 2 seconds
      const timer = setTimeout(() => {
        window.close();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status, provider, searchParams, setRefreshToken]);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Authentication Successful!
            </h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <p className="text-sm text-zinc-500 mb-6">
              This window will close automatically in 2 seconds.
            </p>
            <Button onClick={() => window.close()}>Close Window</Button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">
              Authentication Failed
            </h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <Button onClick={() => window.close()}>Close Window</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
            <p className="text-zinc-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
