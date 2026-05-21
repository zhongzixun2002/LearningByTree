# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

## Architecture

A **tree-structured conversational learning tool** built with React 19 + TypeScript + Vite 8. Users ask questions that form a branching tree — each node contains a question/answer pair, and follow-up questions create child nodes.

### Key layers

- **State**: Zustand store (`src/store/useTreeStore.ts`) — manages tree data, selected node, AI conversation, and settings. Single source of truth.
- **AI integration**: `src/api/claude.ts` — streaming Anthropic-format API calls. Configurable base URL (defaults to DeepSeek's Anthropic-compatible endpoint). Context is built from root→current node path.
- **Layout**: `src/App.tsx` — draggable split panel (tree view left, node detail right).
- **Tree rendering**: `TreeNode.tsx` recursively renders nodes with SVG connector lines and `React.memo` for performance.
- **Types**: `src/types/tree.ts` — `TreeNode` (id, parentId, question, answer, children[]) and `TreeData` (nodes map, rootId, metadata).
- **Utilities**: `src/utils/treeHelpers.ts` (node creation, path context building, export) and `src/utils/layoutEngine.ts`.

### Data flow

Tree data is a flat `Record<string, TreeNode>` with parent/children references. No backend — persistence is via JSON file import/export. API key stored in localStorage.

### Styling

Tailwind CSS 4 via `@tailwindcss/vite` plugin. Custom typography styles for markdown rendering (code blocks, tables, blockquotes) in `src/index.css`.
