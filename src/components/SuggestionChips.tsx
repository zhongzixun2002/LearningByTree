import { useTreeStore } from '../store/useTreeStore';
import { t } from '../i18n/en';

export default function SuggestionChips() {
  const suggestions = useTreeStore((s) => s.suggestedQuestions);
  const askQuestion = useTreeStore((s) => s.askQuestion);
  const isStreaming = useTreeStore((s) => s.isStreaming);

  if (!suggestions.length || isStreaming) return null;

  return (
    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">{t.suggestedFollowups}</div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => askQuestion(s)} className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer transition-colors text-left leading-snug">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
