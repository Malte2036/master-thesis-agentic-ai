import { useEffect, useState } from 'react';
import { useSettings } from './useSettings';
import { getModels } from '../lib/routingApi';

interface SettingsModalProps {
  onClose: () => void;
}

const sizeToFriendly = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, index)).toFixed(2) + ' ' + sizes[index];
};

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();

  const [models, setModels] = useState<{ name: string; size: number }[]>([]);

  useEffect(() => {
    getModels().then(setModels);
  }, []);

  console.log(models);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Router
            </label>
            <select
              value={settings.router}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  router: e.target.value as 'legacy' | 'react',
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="legacy">Legacy</option>
              <option value="react">ReAct</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={settings.model}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  model: e.target.value,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({sizeToFriendly(model.size)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Iterations
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.max_iterations}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  max_iterations: parseInt(e.target.value),
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-hsd-red"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
