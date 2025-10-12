import { beforeEach, afterEach, test, expect } from 'vitest';
import {
  addMapping,
  resetMappings,
} from '@master-thesis-agentic-ai/test-utils';

beforeEach(async () => {
  await resetMappings();
});

afterEach(async () => {
  await resetMappings();
});

test('should call mock endpoint', async () => {
  await addMapping({
    request: {
      method: 'GET',
      url: '/api/test',
    },
    response: {
      status: 200,
      jsonBody: { message: 'Hello from test mock!' },
      headers: { 'Content-Type': 'application/json' },
    },
  });

  const res = await fetch('http://localhost:8081/api/test');
  const data = await res.json();
  expect(data.message).toBe('Hello from test mock!');
});
