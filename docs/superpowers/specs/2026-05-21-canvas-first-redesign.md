# Canvas-First Redesign — Design Spec

## Overview

Transform the tree learning app from a split-panel layout into a full-screen canvas experience optimized for visual learners. The canvas becomes the primary interface where users see their entire knowledge tree at a glance, with a slide-out panel for reading/writing details.

## Architecture

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Top Bar (title, new tree, import/export, settings)     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                  Full-Screen Canvas                      │
│                                                         │
│     [Q]──[A]──[Q]──[A]                                 │
│              └──[Q]──[A]                                │
│                                                         │
│                              ┌─────────────────────┐    │
│                              │  Detail Panel       │    │
│                              │  (slide from right) │    │
│                              │                     │    │
│                              │  Content + Chat     │    │
│                              │  + Suggestions      │    │
│                              └─────────────────────┘    │
│                                                         │
│  [Minimap]                          [Zoom Controls]     │
└─────────────────────────────────────────────────────────┘
```

### Components

1. **CanvasView** (replaces current App split layout)
   - Full-screen zoomable/pannable canvas
   - Renders all visible nodes and SVG connectors
   - Handles canvas-level interactions (pan, zoom, click-to-deselect)

2. **DetailPanel** (replaces current right pane)
   - Slides in from right when a node is selected
   - Width: ~400px, collapsible
   - Contains: node content (markdown rendered), chat input, AI suggestions
   - Close button or click canvas to dismiss

3. **AI Suggestion Bubbles**
   - After AI answers, show 2-3 clickable suggestion chips below the answer in the panel
   - Also optionally show small "+" indicators on the answer node in the canvas
   - Clicking a suggestion auto-sends it as the next question

4. **Learning Path Generator**
   - Triggered via toolbar button or empty-state prompt: "What do you want to learn?"
   - User types a topic → AI generates a skeleton tree (5-8 nodes) with suggested learning order
   - Nodes appear as "unexplored" (dimmed) until user clicks to expand/ask
   - Skeleton structure: Topic → Subtopics → Key questions per subtopic

5. **Minimap**
   - Bottom-left corner, ~150×100px
   - Shows full tree overview with viewport indicator
   - Click to navigate, drag viewport rectangle

6. **Search** (Cmd/Ctrl+K)
   - Overlay search modal
   - Fuzzy search across all node questions and answers
   - Select result → canvas pans to node + selects it

### Data Flow Changes

- `selectedNodeId` now controls panel open/close (null = panel hidden)
- New state: `suggestedQuestions: string[]` — populated after each AI response
- New state: `exploredIds: Set<string>` — tracks which skeleton nodes user has visited
- Node type addition: nodes can have `status: 'skeleton' | 'explored'` for learning paths

### AI Integration Changes

**Suggestion generation:** After streaming completes, make a second lightweight call:
```
"Based on this Q&A, suggest 3 concise follow-up questions the learner might ask next. Return as JSON array."
```

**Learning path generation:** Single call:
```
"Create a learning path for: {topic}. Return as JSON: { title, nodes: [{ question, children: [...] }] }. Aim for 5-8 leaf questions covering fundamentals to advanced."
```

### Internationalization

- All UI strings in English
- AI responds in whatever language the user writes in (no forced language)
- String constants extracted to a single `src/i18n/en.ts` file for future l10n

### Node Visual Updates

Keep the Q/A size differentiation already implemented:
- Q nodes: 160×50, compact, indigo accent
- A nodes: 220×90, content preview, emerald accent
- Skeleton nodes: dashed border, gray/dimmed, "Click to explore" text
- Explored nodes: normal styling
- Selected node: blue ring + panel opens

### Connector Lines

Update connector anchors based on node type/size:
- Line exits from bottom-center of parent
- Line enters top-center of child
- Bezier curves for smooth visual flow

## Migration Plan

This is a layout refactor, not a rewrite:
- `TreeCanvas.tsx` → becomes the main content area (already has zoom/pan/drag)
- `NodeDetail.tsx` + `ChatInput.tsx` → move into a new `DetailPanel.tsx` wrapper
- `App.tsx` → simplified: TopBar + Canvas + Panel overlay
- Store changes are additive (new fields, no breaking changes)

## Out of Scope (Future)

- Multiple trees management
- Rich node types (summary, exercise)
- Spaced repetition
- Export to PDF/Anki
- Collaboration/sharing
