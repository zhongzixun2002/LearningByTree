import { useRef, useState } from 'react';
import NodeDetail from './NodeDetail';
import ChatInput from './ChatInput';
import SuggestionChips from './SuggestionChips';
import { useTreeStore } from '../store/useTreeStore';

const FONT_SIZES = [14, 16, 18, 20];

export default function DetailPanel({ open }: { open: boolean }) {
  const selectNode = useTreeStore((s) => s.selectNode);
  const chatRef = useRef<HTMLTextAreaElement>(null);
  const [fontIdx, setFontIdx] = useState(1); // default 16px

  const handleClose = () => selectNode(null);
  const fontSize = FONT_SIZES[fontIdx];

  return (
    <div
      className={`absolute top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-transform duration-300 ease-out z-10 flex flex-col ${
        open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}
    >
      {/* Top bar: font size + close */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFontIdx((i) => Math.max(0, i - 1))}
            disabled={fontIdx === 0}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-xs font-bold"
          >
            A-
          </button>
          <span className="text-[10px] text-gray-400 w-8 text-center">{fontSize}px</span>
          <button
            onClick={() => setFontIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
            disabled={fontIdx === FONT_SIZES.length - 1}
            className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed text-sm font-bold"
          >
            A+
          </button>
        </div>
        <button
          onClick={handleClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 cursor-pointer transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content with adjustable font size */}
      <div className="flex-1 overflow-auto" style={{ fontSize }}>
        <NodeDetail />
      </div>

      {/* Suggestions */}
      <SuggestionChips />

      {/* Chat input */}
      <ChatInput ref={chatRef} />
    </div>
  );
}
