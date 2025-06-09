export interface Settings {
  moodle_token: string;
  router: 'legacy' | 'react';
  max_iterations: number;
  model: string;
}

export const DEFAULT_SETTINGS: Settings = {
  moodle_token: 'demo-token',
  router: 'react',
  max_iterations: 5,
  model: 'mixtral:8x7b',
};
