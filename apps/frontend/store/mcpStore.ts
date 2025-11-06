import { McpServiceName } from '@/lib/api/mcp';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type McpStore = {
  refreshTokens: Record<McpServiceName, string | undefined>;
  setRefreshToken: (provider: McpServiceName, refreshToken: string) => void;
};

export const useMcpStore = create<McpStore>()(
  persist(
    (set) => ({
      refreshTokens: {} as Record<McpServiceName, string | undefined>,
      setRefreshToken: (provider: McpServiceName, refreshToken: string) =>
        set((state) => ({
          refreshTokens: { ...state.refreshTokens, [provider]: refreshToken },
        })),
    }),
    {
      name: 'mcp-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
