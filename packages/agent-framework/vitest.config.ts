import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Vite's own transform cache:
  cacheDir: '../../node_modules/.vite/agent-framework',

  plugins: [tsconfigPaths()],

  test: {
    globals: true,
    environment: 'node',

    // ✅ Vitest cache must be nested under `cache.dir` (not `cacheDir`)
    cache: {
      dir: '../../node_modules/.vitest',
    },

    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: '../../coverage/packages/agent-framework',
    },
  },
});
