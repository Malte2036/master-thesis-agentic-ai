import { useState } from 'react';
import { Settings, DEFAULT_SETTINGS } from './types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  return { settings, updateSettings };
}
