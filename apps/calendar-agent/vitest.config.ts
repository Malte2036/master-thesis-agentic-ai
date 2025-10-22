import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/calendar-agent',

  plugins: [nxViteTsPaths()],

  test: {
    globals: true,
    cacheDir: '../../node_modules/.vitest',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: '../../coverage/apps/calendar-agent',
    },
  },
});
