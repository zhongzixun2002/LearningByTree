# Canvas-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the split-panel tree learning app into a full-screen canvas with slide-out detail panel, AI suggestions, learning path generator, minimap, and search.

**Architecture:** Full-screen canvas (existing TreeCanvas promoted to main view) with an overlay DetailPanel that slides from the right. New AI features (suggestions, path generator) are additive store fields and API calls. All UI strings extracted to English i18n file.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS 4, Vite 8, Anthropic-format streaming API

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/i18n/en.ts` | All UI string constants |
| Create | `src/components/DetailPanel.tsx` | Slide-out panel (content + chat + suggestions) |
| Create | `src/components/Minimap.tsx` | Canvas minimap overlay |
| Create | `src/components/SearchModal.tsx` | Cmd+K search overlay |
| Create | `src/components/LearningPathDialog.tsx` | Topic input → AI generates skeleton tree |
| Create | `src/components/SuggestionChips.tsx` | Clickable follow-up question chips |
| Create | `src/components/TopBar.tsx` | Extracted top toolbar (English) |
| Modify | `src/types/tree.ts` | Add `status` field to TreeNode |
| Modify | `src/store/useTreeStore.ts` | Add suggestedQuestions, exploredIds, generatePath, fetchSuggestions |
| Modify | `src/api/claude.ts` | Add `fetchSuggestions` and `generateLearningPath` functions |
| Modify | `src/components/TreeCanvas.tsx` | Full-screen, skeleton node rendering, connector anchor fixes |
| Modify | `src/components/NodeCard.tsx` | Skeleton node style, suggestion indicator |
| Modify | `src/utils/layoutEngine.ts` | Variable card sizes for connectors |
| Modify | `src/App.tsx` | Replace split layout with canvas + panel overlay |
| Delete | `src/components/TreeView.tsx` | No longer needed (canvas is top-level) |
| Delete | `src/components/TreeNode.tsx` | Was for recursive list rendering, replaced by canvas |

---

### Task 1: Internationalization — Extract All UI Strings

**Files:**
- Create: `src/i18n/en.ts`
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/NodeDetail.tsx`
- Modify: `src/components/ChatInput.tsx`
- Modify: `src/components/NodeCard.tsx`
- Modify: `src/components/SettingsDialog.tsx`

- [ ] **Step 1: Create the i18n strings file**

```typescript
// src/i18n/en.ts
export const t = {
  // Top bar
  knowledgeTree: 'Knowledge Tree',
  newTree: 'New',
  importTree: 'Import',
  exportTree: 'Export',
  apiSettings: 'API Settings',
  editTitle: 'Click to edit title',

  // Canvas
  emptyTree: 'Tree is empty. Create a new tree or import data.',
  navHint: '↑↓ Navigate  ←→ Collapse  Enter Ask',
  dragging: 'Dragging',
  clickToExplore: 'Click to explore',

  // Node card
  question: 'Q',
  answer: 'A',
  chars: 'chars',

  // Detail panel
  selectNode: 'Select a node to view details',
  questionLabel: 'Question',
  answerLabel: 'Answer',
  emptyQuestion: 'Empty question — type your first question below',
  aiThinking: 'AI is thinking...',
  waitingAI: 'Waiting for AI response...',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  confirmDelete: 'Confirm Delete',
  confirmDeleteMsg: (type: string) => `Delete this ${type} and all its children? This cannot be undone.`,

  // Chat input
  selectNodeFirst: 'Select a node first',
  extendFrom: (q: string) => `Extend from "${q}"`,
  extendFromAnswer: 'Extend from this answer',
  typeFirstQuestion: 'Type your first question here',
  selectAnswerNode: 'Select an answer node to ask follow-up',
  aiAnswering: 'AI is answering...',
  selectNodePlaceholder: 'Select a node first...',
  selectAnswerPlaceholder: 'Select an answer node first...',
  inputPlaceholder: 'Type your question, Enter to send, Shift+Enter for newline...',
  send: 'Send →',
  answering: 'Answering',

  // Suggestions
  suggestedFollowups: 'Suggested follow-ups',

  // Search
  searchPlaceholder: 'Search nodes...',
  noResults: 'No results found',

  // Learning path
  generatePath: 'Generate Learning Path',
  pathPrompt: 'What do you want to learn?',
  generating: 'Generating...',
  startLearning: 'Start Learning',

  // Settings
  apiKeyLabel: 'API Key',
  modelLabel: 'Model',
  baseUrlLabel: 'Base URL',
  closeSettings: 'Close',

  // Minimap
  minimap: 'Minimap',
} as const;
```

- [ ] **Step 2: Replace Chinese strings in Toolbar.tsx**

Replace all Chinese strings with imports from `t`:
- `'知识树'` → `t.knowledgeTree`
- `'← 新建'` → `t.newTree`
- `'↑ 导入'` → `t.importTree`
- `'↓ 导出'` → `t.exportTree`
- `'API 设置'` → `t.apiSettings`
- `'点击编辑标题'` → `t.editTitle`

- [ ] **Step 3: Replace Chinese strings in NodeDetail.tsx**

Replace:
- `'选择一个节点查看详情'` → `t.selectNode`
- `'问题'` / `'回答'` → `t.questionLabel` / `t.answerLabel`
- `'空问题 — 在下方输入你的第一个问题'` → `t.emptyQuestion`
- `'AI 正在思考...'` → `t.aiThinking`
- `'等待 AI 生成回答...'` → `t.waitingAI`
- `'编辑'` → `t.edit`, `'删除'` → `t.delete`
- `'保存修改'` → `t.save`, `'取消'` → `t.cancel`
- `'确认删除'` → `t.confirmDelete`
- Delete confirmation message → `t.confirmDeleteMsg(type)`

- [ ] **Step 4: Replace Chinese strings in ChatInput.tsx**

Replace all `getHint()` and `getPlaceholder()` returns with `t.*` equivalents.

- [ ] **Step 5: Replace Chinese strings in NodeCard.tsx**

Replace:
- `'点击提问'` → `t.emptyQuestion`
- `'等待回答'` → `t.waitingAI`
- `'拖动中'` → `t.dragging`
- `'字'` → `t.chars`

- [ ] **Step 6: Replace Chinese strings in SettingsDialog.tsx**

Replace all Chinese labels with English equivalents from `t`.

- [ ] **Step 7: Verify build passes**

Run: `npm run build`
Expected: successful build with no errors

- [ ] **Step 8: Commit**

```bash
git add src/i18n/en.ts src/components/
git commit -m "feat: extract all UI strings to English i18n file"
```

---

### Task 2: Layout Refactor — Full-Screen Canvas + TopBar

**Files:**
- Create: `src/components/TopBar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/TreeCanvas.tsx`
- Delete: `src/components/TreeView.tsx`

- [ ] **Step 1: Create TopBar component**

```typescript
// src/components/TopBar.tsx
import { useState, useRef } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { t } from '../i18n/en';
import type { TreeData } from '../types/tree';

export default function TopBar({ onOpenSettings, onGeneratePath }: {
  onOpenSettings: () => void;
  onGeneratePath: () => void;
}) {
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
          alert('Invalid file format');
        }
      } catch {
        alert('Cannot parse JSON file');
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
    <header className="flex items-center justify-between px-5 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 relative">
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
            className="text-[15px] font-semibold tracking-tight bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-0.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-[200px]"
          />
        ) : (
          <button
            onClick={() => { setDraftTitle(title); setEditingTitle(true); }}
            className="text-[15px] font-semibold tracking-tight text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors flex items-center gap-1.5 group"
            title={t.editTitle}
          >
            {title}
            <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity">✎</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button onClick={onGeneratePath} className="px-3 py-1.5 text-sm rounded-lg border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition-colors">
          ✨ {t.generatePath}
        </button>
        <button onClick={newTree} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
          {t.newTree}
        </button>
        <button onClick={handleImport} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
          {t.importTree}
        </button>
        <button onClick={exportTree} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
          {t.exportTree}
        </button>
        <div className="w-px h-5 mx-1 bg-gray-200 dark:bg-gray-700" />
        <button onClick={onOpenSettings} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition-colors shadow-sm shadow-blue-500/20">
          {t.apiSettings}
        </button>
      </div>
      <input ref={inputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
    </header>
  );
}
```

- [ ] **Step 2: Rewrite App.tsx as canvas-first layout**

```typescript
// src/App.tsx
import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import TreeCanvas from './components/TreeCanvas';
import DetailPanel from './components/DetailPanel';
import SearchModal from './components/SearchModal';
import LearningPathDialog from './components/LearningPathDialog';
import SettingsDialog from './components/SettingsDialog';
import Minimap from './components/Minimap';
import { useTreeStore } from './store/useTreeStore';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pathDialogOpen, setPathDialogOpen] = useState(false);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);

  // Cmd+K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <TopBar
        onOpenSettings={() => setSettingsOpen(true)}
        onGeneratePath={() => setPathDialogOpen(true)}
      />

      <div className="flex-1 relative overflow-hidden">
        {/* Full-screen canvas */}
        <TreeCanvas />

        {/* Detail panel slides from right */}
        <DetailPanel open={!!selectedNodeId} />

        {/* Minimap bottom-left */}
        <Minimap />
      </div>

      {/* Modals */}
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      {pathDialogOpen && <LearningPathDialog onClose={() => setPathDialogOpen(false)} />}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 3: Update TreeCanvas to be full-screen (remove flex-1 constraint)**

In `src/components/TreeCanvas.tsx`, change the root div:
```typescript
// Before:
<div ref={containerRef} className="flex-1 overflow-auto bg-white/30 dark:bg-gray-900/30 relative" onMouseDown={handlePanMouseDown}>

// After:
<div ref={containerRef} className="absolute inset-0 overflow-auto bg-white/30 dark:bg-gray-900/30 cursor-grab active:cursor-grabbing" onMouseDown={handlePanMouseDown}>
```

Also remove the TreeView wrapper import — TreeCanvas renders directly in App.

- [ ] **Step 4: Delete TreeView.tsx (no longer needed)**

```bash
rm src/components/TreeView.tsx
```

- [ ] **Step 5: Create stub DetailPanel.tsx (full implementation in Task 3)**

```typescript
// src/components/DetailPanel.tsx
export default function DetailPanel({ open }: { open: boolean }) {
  return (
    <div className={`absolute top-0 right-0 h-full w-[400px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl transition-transform duration-300 z-10 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 text-sm text-gray-500">Detail panel placeholder</div>
    </div>
  );
}
```

- [ ] **Step 6: Create stub Minimap.tsx (full implementation in Task 6)**

```typescript
// src/components/Minimap.tsx
export default function Minimap() {
  return null; // implemented in Task 6
}
```

- [ ] **Step 7: Create stub SearchModal.tsx (full implementation in Task 7)**

```typescript
// src/components/SearchModal.tsx
export default function SearchModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[20vh] z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 w-[500px]" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-gray-500">Search placeholder</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create stub LearningPathDialog.tsx (full implementation in Task 5)**

```typescript
// src/components/LearningPathDialog.tsx
export default function LearningPathDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-[400px]" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm text-gray-500">Learning path placeholder</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Delete old Toolbar.tsx**

```bash
rm src/components/Toolbar.tsx
```

- [ ] **Step 10: Verify build passes**

Run: `npm run build`
Expected: successful build with no errors

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: refactor layout to full-screen canvas with overlay panels"
```

---

### Task 3: Detail Panel — Content + Chat + Close

**Files:**
- Modify: `src/components/DetailPanel.tsx`
- Modify: `src/components/NodeDetail.tsx` (extract content, reuse in panel)
- Modify: `src/components/ChatInput.tsx` (minor adjustments)

- [ ] **Step 1: Implement full DetailPanel**

```typescript
// src/components/DetailPanel.tsx
import { useRef } from 'react';
import NodeDetail from './NodeDetail';
import ChatInput from './ChatInput';
import SuggestionChips from './SuggestionChips';
import { useTreeStore } from '../store/useTreeStore';

export default function DetailPanel({ open }: { open: boolean }) {
  const selectNode = useTreeStore((s) => s.selectNode);
  const chatRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = () => selectNode(null as unknown as string);

  return (
    <div className={`absolute top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transition-transform duration-300 ease-out z-10 flex flex-col ${open ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 cursor-pointer transition-colors z-20"
      >
        ✕
      </button>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <NodeDetail />
      </div>

      {/* Suggestions */}
      <SuggestionChips />

      {/* Chat input */}
      <ChatInput ref={chatRef} />
    </div>
  );
}
```

- [ ] **Step 2: Create stub SuggestionChips.tsx (full implementation in Task 4)**

```typescript
// src/components/SuggestionChips.tsx
export default function SuggestionChips() {
  return null; // implemented in Task 4
}
```

- [ ] **Step 3: Update NodeDetail — remove the action buttons bar (keep inline in panel)**

Remove the `border-t` action bar wrapper from NodeDetail so it fits inside the panel's scrollable area. Move edit/delete buttons inline above the content.

- [ ] **Step 4: Update store — allow selectNode(null) to close panel**

In `src/store/useTreeStore.ts`, change selectNode type:
```typescript
selectNode: (id: string | null) => void;
// implementation:
selectNode: (id) => set({ selectedNodeId: id }),
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: successful build

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement slide-out detail panel with content and chat"
```

---

### Task 4: AI Suggestion Chips

**Files:**
- Modify: `src/api/claude.ts` — add `fetchSuggestions` function
- Modify: `src/store/useTreeStore.ts` — add `suggestedQuestions` state + `fetchSuggestions` action
- Modify: `src/components/SuggestionChips.tsx` — render clickable chips

- [ ] **Step 1: Add fetchSuggestions API function**

```typescript
// Add to src/api/claude.ts

export async function fetchSuggestions(
  apiKey: string,
  question: string,
  answer: string,
  model: string,
  baseUrl: string
): Promise<string[]> {
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `Based on this Q&A, suggest 3 concise follow-up questions the learner might ask next. Return ONLY a JSON array of strings, no other text.\n\nQuestion: ${question}\n\nAnswer: ${answer.slice(0, 1000)}`,
      }],
    }),
  });

  if (!response.ok) return [];

  try {
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return [];
}
```

- [ ] **Step 2: Add suggestedQuestions to store**

In `src/store/useTreeStore.ts`:
- Add to interface: `suggestedQuestions: string[]`
- Add to initial state: `suggestedQuestions: []`
- After streaming completes (in `askQuestion` finally block), call `fetchSuggestions` and set result:

```typescript
// After set({ isStreaming: false }), add:
const finalState = get();
const qNode2 = finalState.nodes[qNode.id];
const aNode2 = finalState.nodes[aNode.id];
if (qNode2?.question && aNode2?.answer && !aNode2.answer.startsWith('**Error:**')) {
  fetchSuggestions(finalState.apiKey, qNode2.question, aNode2.answer, finalState.model, finalState.baseUrl)
    .then((suggestions) => set({ suggestedQuestions: suggestions }));
}
```

- [ ] **Step 3: Implement SuggestionChips component**

```typescript
// src/components/SuggestionChips.tsx
import { useTreeStore } from '../store/useTreeStore';
import { t } from '../i18n/en';

export default function SuggestionChips() {
  const suggestions = useTreeStore((s) => s.suggestedQuestions);
  const askQuestion = useTreeStore((s) => s.askQuestion);
  const isStreaming = useTreeStore((s) => s.isStreaming);

  if (!suggestions.length || isStreaming) return null;

  const handleClick = (q: string) => {
    askQuestion(q);
  };

  return (
    <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5">{t.suggestedFollowups}</div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => handleClick(s)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer transition-colors text-left leading-snug"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Clear suggestions when selecting a different node**

In store `selectNode`:
```typescript
selectNode: (id) => set({ selectedNodeId: id, suggestedQuestions: [] }),
```

- [ ] **Step 5: Verify build passes**

Run: `npm run build`
Expected: successful build

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add AI-powered follow-up suggestion chips"
```

---

### Task 5: Learning Path Generator

**Files:**
- Modify: `src/api/claude.ts` — add `generateLearningPath`
- Modify: `src/store/useTreeStore.ts` — add `generatePath` action, `exploredIds`
- Modify: `src/types/tree.ts` — add `status` to TreeNode
- Modify: `src/components/LearningPathDialog.tsx` — topic input UI
- Modify: `src/components/NodeCard.tsx` — skeleton node style

- [ ] **Step 1: Add status field to TreeNode type**

```typescript
// src/types/tree.ts — update TreeNode interface
export interface TreeNode {
  id: string;
  parentId: string | null;
  type: 'question' | 'answer';
  question: string;
  answer: string;
  children: string[];
  position?: { x: number; y: number };
  status?: 'skeleton' | 'explored';
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 2: Add generateLearningPath API function**

```typescript
// Add to src/api/claude.ts

interface PathNode {
  question: string;
  children?: PathNode[];
}

interface LearningPathResponse {
  title: string;
  nodes: PathNode[];
}

export async function generateLearningPath(
  apiKey: string,
  topic: string,
  model: string,
  baseUrl: string
): Promise<LearningPathResponse> {
  const url = `${baseUrl.replace(/\/+$/, '')}/v1/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Create a learning path for: "${topic}". Return ONLY valid JSON with this structure: { "title": "Learning: topic", "nodes": [{ "question": "subtopic question", "children": [{ "question": "specific question" }] }] }. Aim for 3-4 top-level subtopics, each with 1-2 specific questions. Keep questions concise.`,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid response format');
  return JSON.parse(match[0]);
}
```

- [ ] **Step 3: Add generatePath action to store**

In `src/store/useTreeStore.ts`, add to interface and implementation:

```typescript
// Interface addition:
exploredIds: Set<string>;
generatePath: (topic: string) => Promise<void>;
markExplored: (nodeId: string) => void;

// Initial state:
exploredIds: new Set<string>(),

// Implementation:
generatePath: async (topic) => {
  const state = get();
  if (!state.apiKey) throw new Error('Please configure API Key first');

  const path = await generateLearningPath(state.apiKey, topic, state.model, state.baseUrl);

  // Build tree from path response
  const nodes: Record<string, TreeNode> = {};
  const rootNode = createNode('question', topic, null);
  rootNode.status = 'skeleton';
  nodes[rootNode.id] = rootNode;

  function buildSubtree(parentId: string, pathNodes: { question: string; children?: { question: string; children?: any[] }[] }[]) {
    for (const pn of pathNodes) {
      const qNode = createNode('question', pn.question, parentId);
      qNode.status = 'skeleton';
      nodes[qNode.id] = qNode;
      nodes[parentId] = { ...nodes[parentId], children: [...nodes[parentId].children, qNode.id] };
      if (pn.children?.length) {
        buildSubtree(qNode.id, pn.children);
      }
    }
  }

  buildSubtree(rootNode.id, path.nodes);

  set({
    nodes,
    rootId: rootNode.id,
    title: path.title,
    selectedNodeId: rootNode.id,
    collapsedIds: new Set<string>(),
    exploredIds: new Set<string>(),
  });
},

markExplored: (nodeId) => {
  set((state) => {
    const node = state.nodes[nodeId];
    if (!node) return state;
    const next = new Set(state.exploredIds);
    next.add(nodeId);
    return {
      exploredIds: next,
      nodes: {
        ...state.nodes,
        [nodeId]: { ...node, status: 'explored' },
      },
    };
  });
},
```

- [ ] **Step 4: Implement LearningPathDialog**

```typescript
// src/components/LearningPathDialog.tsx
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
    try {
      await generatePath(topic.trim());
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error generating path');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-[440px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">✨ {t.generatePath}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.pathPrompt}</p>
        <input
          autoFocus
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="e.g. Machine Learning, React Hooks, Photography..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
            {t.cancel}
          </button>
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || loading}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {loading ? t.generating : t.startLearning}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add skeleton node style to NodeCard**

In `src/components/NodeCard.tsx`, add skeleton style branch:

```typescript
const isSkeleton = node.status === 'skeleton';

// Update typeColors:
const typeColors = isSkeleton
  ? 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30'
  : isQuestion
    ? 'border-l-indigo-400 bg-white dark:bg-gray-800/90'
    : 'border-l-emerald-400 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-gray-800/80';

// In the content area, if skeleton show "Click to explore":
{isSkeleton && !isQuestion ? null : isSkeleton ? (
  <div className="text-[12px] text-gray-400 dark:text-gray-500 italic">{t.clickToExplore}</div>
) : /* existing content rendering */}
```

- [ ] **Step 6: On skeleton node click, mark explored and trigger AI**

In NodeCard click handler or in the store's selectNode, add logic:
```typescript
// In NodeCard onClick:
onClick={() => {
  if (!dragState.current.moved) {
    selectNode(node.id);
    if (node.status === 'skeleton') {
      markExplored(node.id);
    }
  }
}}
```

Add `markExplored` to the NodeCard component's store subscriptions.

- [ ] **Step 7: Verify build passes**

Run: `npm run build`
Expected: successful build

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add learning path generator with skeleton nodes"
```

---

### Task 6: Minimap

**Files:**
- Modify: `src/components/Minimap.tsx`
- Modify: `src/components/TreeCanvas.tsx` (expose scroll state via ref/context)

- [ ] **Step 1: Implement Minimap component**

```typescript
// src/components/Minimap.tsx
import { useMemo } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { autoPositionNodes, getCanvasBounds } from '../utils/layoutEngine';

export default function Minimap() {
  const nodes = useTreeStore((s) => s.nodes);
  const rootId = useTreeStore((s) => s.rootId);
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);

  const positions = useMemo(() => autoPositionNodes(nodes, rootId), [nodes, rootId]);
  const bounds = useMemo(() => getCanvasBounds(positions), [positions]);

  const nodeIds = Object.keys(positions);
  if (nodeIds.length < 2) return null;

  const MINIMAP_W = 150;
  const MINIMAP_H = 100;
  const scaleX = MINIMAP_W / bounds.width;
  const scaleY = MINIMAP_H / bounds.height;
  const scale = Math.min(scaleX, scaleY) * 0.85;

  return (
    <div className="absolute bottom-4 left-4 w-[150px] h-[100px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden z-10">
      <svg width={MINIMAP_W} height={MINIMAP_H} className="w-full h-full">
        {nodeIds.map((id) => {
          const pos = positions[id];
          const node = nodes[id];
          if (!pos || !node) return null;
          const x = (pos.x - bounds.minX) * scale + 10;
          const y = (pos.y - bounds.minY) * scale + 10;
          const isSelected = id === selectedNodeId;
          return (
            <rect
              key={id}
              x={x}
              y={y}
              width={node.type === 'question' ? 8 : 11}
              height={node.type === 'question' ? 4 : 6}
              rx={1}
              className={isSelected
                ? 'fill-blue-500'
                : node.type === 'question'
                  ? 'fill-indigo-400/60'
                  : 'fill-emerald-400/60'
              }
            />
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: successful build

- [ ] **Step 3: Commit**

```bash
git add src/components/Minimap.tsx
git commit -m "feat: add minimap for canvas navigation overview"
```

---

### Task 7: Search Modal (Cmd+K)

**Files:**
- Modify: `src/components/SearchModal.tsx`

- [ ] **Step 1: Implement SearchModal with fuzzy matching**

```typescript
// src/components/SearchModal.tsx
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

  const handleSelect = (id: string) => {
    selectNode(id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      handleSelect(results[selectedIdx].id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[20vh] z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[500px] max-w-[90vw] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 focus:outline-none placeholder-gray-400"
          />
        </div>
        <div className="max-h-[300px] overflow-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">{t.noResults}</div>
          )}
          {results.map((node, i) => (
            <button
              key={node.id}
              onClick={() => handleSelect(node.id)}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-2 cursor-pointer transition-colors ${
                i === selectedIdx ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                node.type === 'question' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
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
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: successful build

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchModal.tsx
git commit -m "feat: add Cmd+K search modal with fuzzy matching"
```

---

### Task 8: Connector Line Anchors — Adapt to Variable Node Sizes

**Files:**
- Modify: `src/utils/layoutEngine.ts`

- [ ] **Step 1: Update getConnectorPath for Q/A node sizes**

```typescript
// src/utils/layoutEngine.ts — replace constants and getConnectorPath

const Q_CARD_W = 160;
const Q_CARD_H = 50;
const A_CARD_W = 220;
const A_CARD_H = 90;
const H_GAP = 240;
const V_GAP = 160;

// Update getConnectorPath to accept node types
export function getConnectorPath(
  from: Point,
  to: Point,
  fromType: 'question' | 'answer' = 'question',
  toType: 'question' | 'answer' = 'question'
): string {
  const fromW = fromType === 'question' ? Q_CARD_W : A_CARD_W;
  const fromH = fromType === 'question' ? Q_CARD_H : A_CARD_H;
  const toW = toType === 'question' ? Q_CARD_W : A_CARD_W;

  const x1 = from.x + fromW / 2;
  const y1 = from.y + fromH;
  const x2 = to.x + toW / 2;
  const y2 = to.y;

  const dy = Math.max(Math.abs(y2 - y1) * 0.5, 40);
  return `M ${x1} ${y1} C ${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`;
}

// Update getCanvasBounds to use max card size
export function getCanvasBounds(
  positions: Record<string, Point>
): { minX: number; minY: number; width: number; height: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const pos of Object.values(positions)) {
    if (pos.x < minX) minX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.x + A_CARD_W > maxX) maxX = pos.x + A_CARD_W;
    if (pos.y + A_CARD_H > maxY) maxY = pos.y + A_CARD_H;
  }

  const padding = 100;
  return {
    minX: minX - padding,
    minY: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}
```

- [ ] **Step 2: Update TreeCanvas connector rendering to pass node types**

In `src/components/TreeCanvas.tsx`, update the connectors useMemo:
```typescript
const connectors = useMemo(() => {
  const lines: { key: string; path: string }[] = [];
  for (const id of visibleIds) {
    const node = nodes[id];
    if (!node) continue;
    if (collapsedIds.has(id)) continue;
    const from = displayPositions[id];
    if (!from) continue;
    for (const childId of node.children) {
      const child = nodes[childId];
      const to = displayPositions[childId];
      if (visibleSet.has(childId) && to && child) {
        lines.push({
          key: `${id}-${childId}`,
          path: getConnectorPath(from, to, node.type, child.type),
        });
      }
    }
  }
  return lines;
}, [visibleIds, visibleSet, nodes, displayPositions, collapsedIds]);
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: successful build

- [ ] **Step 4: Commit**

```bash
git add src/utils/layoutEngine.ts src/components/TreeCanvas.tsx
git commit -m "feat: adapt connector lines to variable Q/A node sizes"
```

---

### Task 9: Final Polish — Canvas Deselect + Keyboard Nav Update

**Files:**
- Modify: `src/components/TreeCanvas.tsx` — click canvas to deselect (close panel)
- Modify: `src/App.tsx` — move keyboard nav here, update for new layout

- [ ] **Step 1: Add canvas click-to-deselect**

In TreeCanvas's `handlePanMouseDown`, track if it was a pure click (no move):

```typescript
const handlePanMouseDown = useCallback((e: React.MouseEvent) => {
  if ((e.target as HTMLElement).closest('button')) return;
  if ((e.target as HTMLElement).closest('[data-node-card]')) return;
  if (!containerRef.current) return;
  
  const startX = e.clientX;
  const startY = e.clientY;
  panRef.current = {
    panning: true,
    sx: startX,
    sy: startY,
    sl: containerRef.current.scrollLeft,
    st: containerRef.current.scrollTop,
  };
  document.body.style.cursor = 'grabbing';
  document.body.style.userSelect = 'none';

  let moved = false;
  const handleMove = (ev: MouseEvent) => {
    if (!panRef.current.panning) return;
    if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) moved = true;
    containerRef.current!.scrollLeft = panRef.current.sl - (ev.clientX - panRef.current.sx);
    containerRef.current!.scrollTop = panRef.current.st - (ev.clientY - panRef.current.sy);
  };
  const handleUp = () => {
    panRef.current.panning = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    // If no movement, deselect (close panel)
    if (!moved) {
      useTreeStore.getState().selectNode(null as unknown as string);
    }
    document.removeEventListener('mousemove', handleMove);
    document.removeEventListener('mouseup', handleUp);
  };
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleUp);
}, []);
```

- [ ] **Step 2: Add `data-node-card` attribute to NodeCard root div**

In NodeCard.tsx, add `data-node-card` to the root div so canvas click handler can skip it.

- [ ] **Step 3: Verify build passes and test full flow**

Run: `npm run build`
Expected: successful build

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: click canvas to close panel, final layout polish"
```

---

## Execution Order Summary

1. **Task 1** — i18n (English strings) — no dependencies
2. **Task 2** — Layout refactor (full-screen canvas + stubs) — depends on Task 1
3. **Task 3** — Detail Panel implementation — depends on Task 2
4. **Task 4** — AI Suggestion Chips — depends on Task 3
5. **Task 5** — Learning Path Generator — depends on Task 2
6. **Task 6** — Minimap — depends on Task 2
7. **Task 7** — Search Modal — depends on Task 2
8. **Task 8** — Connector line anchors — depends on Task 2
9. **Task 9** — Final polish — depends on all above
