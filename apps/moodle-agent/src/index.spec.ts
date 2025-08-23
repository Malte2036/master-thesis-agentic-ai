import { describe, it, expect } from 'vitest';
import {
  Logger,
  LoggerConfig,
} from '@master-thesis-agentic-ai/agent-framework';

describe('Moodle Agent Tests', () => {
  it('should confirm that tests are running', () => {
    const logger = new Logger();
    expect(true).toBe(true);
  });
});
