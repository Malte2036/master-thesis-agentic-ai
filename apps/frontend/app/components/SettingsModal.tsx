import { Settings } from './types';

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
