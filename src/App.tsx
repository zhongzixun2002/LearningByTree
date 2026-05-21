import { useState, useCallback, useRef, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import TreeView from './components/TreeView';
import NodeDetail from './components/NodeDetail';
import ChatInput from './components/ChatInput';
import SettingsDialog from './components/SettingsDialog';
import { useTreeStore } from './store/useTreeStore';
import { getVisibleNodeIds } from './utils/treeHelpers';

const MIN_LEFT = 260;
const MAX_LEFT_RATIO = 0.5;

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leftWidth, setLeftWidth] = useState(380);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

  const selectNode = useTreeStore((s) => s.selectNode);
  const toggleCollapse = useTreeStore((s) => s.toggleCollapse);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxWidth = rect.width * MAX_LEFT_RATIO;
    let newWidth = e.clientX - rect.left;
    newWidth = Math.max(MIN_LEFT, Math.min(maxWidth, newWidth));
    setLeftWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const state = useTreeStore.getState();
      const { nodes, rootId, selectedNodeId: sid, collapsedIds } = state;
      const visibleIds = getVisibleNodeIds(nodes, rootId, collapsedIds);
      const idx = sid ? visibleIds.indexOf(sid) : -1;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          if (idx >= 0 && idx < visibleIds.length - 1) {
            selectNode(visibleIds[idx + 1]);
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          if (idx > 0) {
            selectNode(visibleIds[idx - 1]);
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          if (sid && nodes[sid] && nodes[sid].children.length > 0 && !collapsedIds.has(sid)) {
            toggleCollapse(sid);
          } else if (sid && nodes[sid]?.parentId) {
            selectNode(nodes[sid].parentId);
          }
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          if (sid && nodes[sid] && nodes[sid].children.length > 0 && collapsedIds.has(sid)) {
            toggleCollapse(sid);
          } else if (sid && nodes[sid]?.children.length) {
            const firstChild = nodes[sid].children[0];
            if (nodes[firstChild]) selectNode(firstChild);
          }
          break;
        }
        case 'Enter': {
          e.preventDefault();
          chatTextareaRef.current?.focus();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectNode, toggleCollapse]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-blue-200/50 dark:selection:bg-blue-800/50">
      <Toolbar onOpenSettings={() => setSettingsOpen(true)} />

      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left: Tree View */}
        <div
          className="flex flex-col bg-white/50 dark:bg-gray-900/50 flex-shrink-0 overflow-hidden"
          style={{ width: leftWidth }}
        >
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              知识树
            </span>
            <span className="text-[10px] text-gray-300 dark:text-gray-600 ml-auto">
              ↑↓导航 ←→折叠 Enter提问
            </span>
          </div>
          <TreeView />
        </div>

        {/* Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 flex-shrink-0 cursor-col-resize relative group z-10"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:w-1.5 bg-transparent group-hover:bg-blue-400/50 transition-all duration-200" />
        </div>

        {/* Right: Detail + Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <NodeDetail />
          <ChatInput ref={chatTextareaRef} />
        </div>
      </div>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
