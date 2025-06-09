import { Settings } from './types';

const AVAILABLE_MODELS = [
  { value: 'mixtral:8x7b', label: 'Mixtral 8x7B', size: '47GB' },
  { value: 'llama3.1:8b', label: 'Llama 3.1 8B', size: '4.7GB' },
  { value: 'llama3.1:70b', label: 'Llama 3.1 70B', size: '40GB' },
  { value: 'qwen2.5:14b', label: 'Qwen 2.5 14B', size: '8.7GB' },
];

interface SettingsModalProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  onUpdateSettings,
  onClose,
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moodle Token
            </label>
            <input
              type="text"
              value={settings.moodle_token}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  moodle_token: e.target.value,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Router
            </label>
            <select
              value={settings.router}
              onChange={(e) =>
                onUpdateSettings({
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
                onUpdateSettings({
                  ...settings,
                  model: e.target.value,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} ({model.size})
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
                onUpdateSettings({
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
