import { useState, useRef, useEffect, forwardRef } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { t } from '../i18n/en';

const ChatInput = forwardRef<HTMLTextAreaElement>(function ChatInput(_, ref) {
  const [question, setQuestion] = useState('');
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const nodes = useTreeStore((s) => s.nodes);
  const askQuestion = useTreeStore((s) => s.askQuestion);
  const isStreaming = useTreeStore((s) => s.isStreaming);
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || innerRef;

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [question]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [selectedNodeId]);

  const canAsk = selectedNode && (
    selectedNode.type === 'answer' ||
    (selectedNode.type === 'question' && !selectedNode.question && !selectedNode.parentId)
  );

  const handleSubmit = async () => {
    const trimmed = question.trim();
    if (!trimmed || isStreaming || !canAsk) return;

    setQuestion('');
    try {
      await askQuestion(trimmed);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getHint = () => {
    if (!selectedNode) return t.selectNodeFirst;
    if (selectedNode.type === 'answer') {
      const parentQ = selectedNode.parentId ? nodes[selectedNode.parentId] : null;
      return parentQ?.question
        ? t.extendFrom(parentQ.question.slice(0, 30) + (parentQ.question.length > 30 ? '...' : ''))
        : t.extendFromAnswer;
    }
    if (selectedNode.type === 'question' && !selectedNode.question) {
      return t.typeFirstQuestion;
    }
    return t.selectAnswerNode;
  };

  const getPlaceholder = () => {
    if (isStreaming) return t.aiAnswering;
    if (!selectedNode) return t.selectNodePlaceholder;
    if (selectedNode.type === 'question' && selectedNode.question) {
      return t.selectAnswerPlaceholder;
    }
    return t.inputPlaceholder;
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-5 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-1.5 h-1.5 rounded-full ${canAsk ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {getHint()}
          </span>
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700
                       bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm resize-none
                       text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                       placeholder-gray-400 dark:placeholder-gray-500
                       transition-shadow leading-relaxed"
            placeholder={getPlaceholder()}
            rows={1}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || !canAsk}
          />
          <button
            onClick={handleSubmit}
            disabled={isStreaming || !question.trim() || !canAsk}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium
                       hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-800
                       disabled:text-gray-400 dark:disabled:text-gray-600
                       cursor-pointer disabled:cursor-not-allowed
                       transition-all duration-150 active:scale-95"
          >
            {isStreaming ? (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                {t.answering}
              </span>
            ) : (
              t.send
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatInput;
