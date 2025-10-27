// vitest-ctx.d.ts
import { Wiremock } from '@master-thesis-agentic-ai/test-utils';
import 'vitest';

declare module 'vitest' {
  export interface TestContext {
    wiremock: Wiremock;
  }
}
