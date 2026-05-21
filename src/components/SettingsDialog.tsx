import { useState } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { t } from '../i18n/en';

export default function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const apiKey = useTreeStore((s) => s.apiKey);
  const model = useTreeStore((s) => s.model);
  const baseUrl = useTreeStore((s) => s.baseUrl);
  const setApiKey = useTreeStore((s) => s.setApiKey);
  const setModel = useTreeStore((s) => s.setModel);
  const setBaseUrl = useTreeStore((s) => s.setBaseUrl);
  const [localKey, setLocalKey] = useState(apiKey);
  const [localModel, setLocalModel] = useState(model);
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl);

  if (!open) return null;

  const handleSave = () => {
    setApiKey(localKey);
    setModel(localModel);
    setBaseUrl(localBaseUrl);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-[480px] max-w-[90vw]">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {t.settings}
        </h2>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.apiKeyLabel}
          </span>
          <input
            type="password"
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 px-3 py-2 text-sm
                       text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="sk-..."
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t.apiKeyStoredLocally}
          </p>
        </label>

        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.baseUrlLabel}
          </span>
          <input
            type="text"
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 px-3 py-2 text-sm
                       text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://api.deepseek.com/anthropic"
            value={localBaseUrl}
            onChange={(e) => setLocalBaseUrl(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t.baseUrlHint}
          </p>
        </label>

        <label className="block mb-6">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.modelLabel}
          </span>
          <select
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 px-3 py-2 text-sm
                       text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={localModel}
            onChange={(e) => setLocalModel(e.target.value)}
          >
            <option value="deepseek-v4-pro">DeepSeek V4 Pro</option>
            <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
          </select>
        </label>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                       cursor-pointer transition-colors"
            onClick={onClose}
          >
            {t.cancel}
          </button>
          <button
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white
                       hover:bg-blue-700 cursor-pointer transition-colors"
            onClick={handleSave}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
