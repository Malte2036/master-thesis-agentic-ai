# How to Add Vitest to a Project

This guide outlines the steps to add Vitest for testing in a project within this monorepo.

## 1. Install Dependencies

First, install the necessary dependencies.

```bash
pnpm add -w @nx/vite vitest @vitest/coverage-v8 ts-node
```

## 2. Create `vitest.config.ts`

Create a `vitest.config.ts` file in the root of the project (e.g., `apps/my-app/vitest.config.ts`).

```typescript
import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/my-app',

  plugins: [nxViteTsPaths()],

  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: '../../coverage/apps/my-app',
    },
  },
});
```

**Note:** Replace `my-app` with the name of your project in `cacheDir` and `reportsDirectory`.

## 3. Update `project.json`

Update the `project.json` file of the project to include a `test` target for Vitest.

```json
{
  "targets": {
    ...
    "test": {
      "executor": "@nx/vite:test",
      "outputs": [
        "{workspaceRoot}/coverage/apps/my-app"
      ],
      "options": {
        "passWithNoTests": true,
        "reportsDirectory": "{workspaceRoot}/coverage/apps/my-app"
      }
    }
    ...
  }
}
```

**Note:** Replace `my-app` with the name of your project in `outputs` and `reportsDirectory`.

## 4. Create a Test File

Create a test file to verify the setup. For example, `src/index.spec.ts`.

```typescript
import { describe, it, expect } from 'vitest';

describe('My App Tests', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
```

## 5. Run the Tests

Run the tests using the following command:

```bash
npx nx test <project-name>
```

Replace `<project-name>` with the name of your project (e.g., `@master-thesis-agentic-ai/my-app`).
