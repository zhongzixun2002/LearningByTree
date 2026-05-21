import { useState } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { t } from '../i18n/en';

export default function LearningPathDialog({ onClose }: { onClose: () => void }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const generatePath = useTreeStore((s) => s.generatePath);

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    try { await generatePath(topic.trim()); onClose(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-[440px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">✨ {t.generatePath}</h2>
        <p className="text-sm text-gray-500 mb-4">{t.pathPrompt}</p>
        <input autoFocus value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          placeholder="e.g. Machine Learning, React Hooks, Photography..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4" />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">{t.cancel}</button>
          <button onClick={handleGenerate} disabled={!topic.trim() || loading} className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer">{loading ? t.generating : t.startLearning}</button>
        </div>
      </div>
    </div>
  );
}
