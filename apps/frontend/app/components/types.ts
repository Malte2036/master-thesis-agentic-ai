export interface Settings {
  router: 'legacy' | 'react';
  max_iterations: number;
  model: string;
}

export const DEFAULT_SETTINGS: Settings = {
  router: 'react',
  max_iterations: 5,
  model: 'qwen3:4b',
};
