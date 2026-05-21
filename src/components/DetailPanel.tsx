import { useRef } from 'react';
import NodeDetail from './NodeDetail';
import ChatInput from './ChatInput';
import SuggestionChips from './SuggestionChips';
import { useTreeStore } from '../store/useTreeStore';

export default function DetailPanel({ open }: { open: boolean }) {
  const selectNode = useTreeStore((s) => s.selectNode);
  const chatRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = () => selectNode(null);

  return (
    <div
      className={`absolute top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-transform duration-300 ease-out z-10 flex flex-col ${
        open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}
    >
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 cursor-pointer transition-colors z-20"
      >
        ✕
      </button>
      <div className="flex-1 overflow-auto">
        <NodeDetail />
      </div>
      <SuggestionChips />
      <ChatInput ref={chatRef} />
    </div>
  );
}
