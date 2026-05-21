import { useState, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { useTreeStore } from '../store/useTreeStore';
import { t } from '../i18n/en';

function CodeBlock({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { className?: string }) {
  const match = /language-(\w+)/.exec(className || '');
  const isInline = !match && !className;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [children]);

  if (isInline) {
    return (
      <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-[0.8125em] font-medium" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-4">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-t-xl border-b border-gray-300/30 dark:border-gray-600/30 text-xs text-gray-500 dark:text-gray-400">
        <span>{match ? match[1] : 'code'}</span>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded
                     hover:bg-gray-300/50 dark:hover:bg-gray-600/50 cursor-pointer"
        >
          {copied ? t.copied : t.copy}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none !rounded-b-xl !bg-[#1e1e2e] !text-[#cdd6f4] !p-4 !text-sm !leading-relaxed overflow-x-auto">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

const components: Components = {
  code: CodeBlock,
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
      {children}
    </td>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="text-blue-600 dark:text-blue-400 hover:underline">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 pl-4 pr-4 py-3 my-4 rounded-r-lg text-gray-700 dark:text-gray-300">
      {children}
    </blockquote>
  ),
  hr: () => (
    <div className="my-6 border-t border-gray-200 dark:border-gray-700" />
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt} className="rounded-lg shadow-md my-4 max-w-full" />
  ),
};

export default function NodeDetail() {
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const nodes = useTreeStore((s) => s.nodes);
  const selectNode = useTreeStore((s) => s.selectNode);
  const updateNode = useTreeStore((s) => s.updateNode);
  const deleteNode = useTreeStore((s) => s.deleteNode);
  const isStreaming = useTreeStore((s) => s.isStreaming);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const node = selectedNodeId ? nodes[selectedNodeId] : null;
  const isQuestion = node?.type === 'question';

  // Get parent question for Answer nodes
  const parentQuestion = node && !isQuestion && node.parentId
    ? nodes[node.parentId]
    : null;

  if (!node) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        {t.selectNode}
      </div>
    );
  }

  const handleEdit = () => {
    setEditText(isQuestion ? node.question : node.answer);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (isQuestion) {
      updateNode(node.id, { question: editText });
    } else {
      updateNode(node.id, { answer: editText });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteNode(node.id);
    setShowConfirmDelete(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-5">
          {/* Parent context for Answer nodes */}
          {!isQuestion && parentQuestion && (
            <div className="mb-4">
              <button
                onClick={() => selectNode(parentQuestion.id)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500
                           transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>↩</span>
                <span className="truncate max-w-md">
                  Q: {parentQuestion.question || t.emptyQuestion}
                </span>
              </button>
            </div>
          )}

          {/* Main content */}
          <div className="mb-3">
            <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
              {isQuestion ? t.questionLabel : t.answerLabel}
            </div>
            {isEditing ? (
              <textarea
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-800 px-4 py-3 text-sm
                           text-gray-900 dark:text-gray-100 resize-none
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                           transition-shadow leading-relaxed"
                rows={isQuestion ? 3 : 16}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            ) : isQuestion ? (
              <div className="text-[15px] font-semibold leading-relaxed text-gray-900 dark:text-gray-100 tracking-tight">
                {node.question || (
                  <span className="text-gray-300 dark:text-gray-600 italic">{t.emptyQuestion}</span>
                )}
              </div>
            ) : (
              <div className="prose prose-base dark:prose-invert max-w-none">
                {node.answer ? (
                  <Markdown remarkPlugins={[remarkGfm]} components={components}>
                    {node.answer}
                  </Markdown>
                ) : isStreaming ? (
                  <div className="flex items-center gap-3 py-8">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-gray-400 text-sm">{t.aiThinking}</span>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-300 dark:text-gray-600">
                    <div className="text-3xl mb-2">💡</div>
                    <div className="text-sm">{t.waitingAI}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white
                           hover:bg-green-700 cursor-pointer transition-colors"
              >
                {t.save}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                           text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                           cursor-pointer transition-colors"
              >
                {t.cancel}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="px-4 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                           text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800
                           cursor-pointer transition-colors"
              >
                {t.edit}
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="px-4 py-1.5 text-sm rounded-lg text-red-500 hover:text-red-600
                           hover:bg-red-50 dark:hover:bg-red-950/30
                           cursor-pointer transition-colors"
              >
                {t.delete}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      {showConfirmDelete && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowConfirmDelete(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-[360px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t.confirmDelete}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              {t.confirmDeleteMsg(isQuestion ? t.questionLabel.toLowerCase() : t.answerLabel.toLowerCase())}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600
                           text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                           cursor-pointer transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-red-600 text-white
                           hover:bg-red-700 cursor-pointer transition-colors"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
