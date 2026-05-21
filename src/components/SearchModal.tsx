import { useState, useMemo, useEffect, useRef } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { t } from '../i18n/en';

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const nodes = useTreeStore((s) => s.nodes);
  const selectNode = useTreeStore((s) => s.selectNode);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return Object.values(nodes)
      .filter((n) => n.question.toLowerCase().includes(q) || n.answer.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, nodes]);

  useEffect(() => { setSelectedIdx(0); }, [results]);

  const handleSelect = (id: string) => { selectNode(id); onClose(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIdx]) { handleSelect(results[selectedIdx].id); }
    else if (e.key === 'Escape') { onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[20vh] z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[500px] max-w-[90vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 focus:outline-none placeholder-gray-400" />
        </div>
        <div className="max-h-[300px] overflow-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">{t.noResults}</div>
          )}
          {results.map((node, i) => (
            <button key={node.id} onClick={() => handleSelect(node.id)}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-2 cursor-pointer transition-colors ${i === selectedIdx ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${node.type === 'question' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {node.type === 'question' ? 'Q' : 'A'}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {node.type === 'question' ? node.question : node.answer.slice(0, 60)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
