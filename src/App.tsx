import { useState, useCallback, useEffect } from 'react';
import TopBar from './components/TopBar';
import TreeCanvas from './components/TreeCanvas';
import DetailPanel from './components/DetailPanel';
import Minimap from './components/Minimap';
import SearchModal from './components/SearchModal';
import LearningPathDialog from './components/LearningPathDialog';
import SettingsDialog from './components/SettingsDialog';
import { useTreeStore } from './store/useTreeStore';
import { getVisibleNodeIds } from './utils/treeHelpers';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pathDialogOpen, setPathDialogOpen] = useState(false);

  const selectNode = useTreeStore((s) => s.selectNode);
  const toggleCollapse = useTreeStore((s) => s.toggleCollapse);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);

  // Keyboard navigation + shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        if (searchOpen) { setSearchOpen(false); return; }
        if (pathDialogOpen) { setPathDialogOpen(false); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
      }

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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectNode, toggleCollapse, searchOpen, pathDialogOpen, settingsOpen]);

  const handleCloseSearch = useCallback(() => setSearchOpen(false), []);
  const handleClosePath = useCallback(() => setPathDialogOpen(false), []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-blue-200/50 dark:selection:bg-blue-800/50">
      <TopBar
        onOpenSettings={() => setSettingsOpen(true)}
        onGeneratePath={() => setPathDialogOpen(true)}
      />
      <div className="flex-1 relative overflow-hidden">
        <TreeCanvas />
        <DetailPanel open={!!selectedNodeId} />
        <Minimap />
      </div>
      {searchOpen && <SearchModal onClose={handleCloseSearch} />}
      {pathDialogOpen && <LearningPathDialog onClose={handleClosePath} />}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
