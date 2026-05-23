import { useState, useRef } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import type { TreeData } from '../types/tree';

export default function Toolbar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const title = useTreeStore((s) => s.title);
  const setTitle = useTreeStore((s) => s.setTitle);
  const newTree = useTreeStore((s) => s.newTree);
  const exportTree = useTreeStore((s) => s.exportTree);
  const importTree = useTreeStore((s) => s.importTree);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  const handleImport = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as TreeData;
        if (data.nodes && data.rootId && data.metadata) {
          importTree(data);
        } else {
          alert('无效的文件格式');
        }
      } catch {
        alert('无法解析 JSON 文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTitleSave = () => {
    const trimmed = draftTitle.trim();
    if (trimmed) setTitle(trimmed);
    else setDraftTitle(title);
    setEditingTitle(false);
  };

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <span className="text-lg">🌳</span>
        {editingTitle ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') { setDraftTitle(title); setEditingTitle(false); }
            }}
            className="text-[15px] font-semibold tracking-tight bg-gray-50 dark:bg-gray-800
                       border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-0.5
                       text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       w-[200px]"
          />
        ) : (
          <button
            onClick={() => { setDraftTitle(title); setEditingTitle(true); }}
            className="text-[15px] font-semibold tracking-tight text-gray-800 dark:text-gray-100
                       hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer
                       transition-colors flex items-center gap-1.5 group"
            title="点击编辑标题"
          >
            {title}
            <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity">
              ✎
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={newTree}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                     text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800
                     hover:text-gray-800 dark:hover:text-gray-200
                     cursor-pointer transition-colors"
        >
          ← 新建
        </button>
        <button
          onClick={handleImport}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                     text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800
                     hover:text-gray-800 dark:hover:text-gray-200
                     cursor-pointer transition-colors"
        >
          ↑ 导入
        </button>
        <button
          onClick={exportTree}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                     text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800
                     hover:text-gray-800 dark:hover:text-gray-200
                     cursor-pointer transition-colors"
        >
          ↓ 导出
        </button>
        <div className="w-px h-5 mx-1 bg-gray-200 dark:bg-gray-700" />
        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white
                     hover:bg-blue-700 cursor-pointer transition-colors shadow-sm shadow-blue-500/20"
        >
          API 设置
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </header>
  );
}
