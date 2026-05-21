import { create } from 'zustand';
import type { TreeNode, TreeData } from '../types/tree';
import {
  createNode,
  createSampleTree,
  migrateLegacyNodes,
  getContextPath,
  getDescendantIds,
  downloadJSON,
} from '../utils/treeHelpers';
import { streamClaudeResponse, fetchSuggestions } from '../api/claude';

interface TreeState {
  nodes: Record<string, TreeNode>;
  rootId: string;
  title: string;
  selectedNodeId: string | null;
  collapsedIds: Set<string>;
  isStreaming: boolean;
  suggestedQuestions: string[];
  apiKey: string;
  model: string;
  baseUrl: string;

  selectNode: (id: string | null) => void;
  addNode: (type: 'question' | 'answer', parentId: string, text: string) => string;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: { question?: string; answer?: string }) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  toggleCollapse: (nodeId: string) => void;
  importTree: (data: TreeData) => void;
  exportTree: () => void;
  newTree: () => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (url: string) => void;
  setTitle: (title: string) => void;
  askQuestion: (question: string) => Promise<void>;
}

function loadSettings() {
  try {
    const apiKey = localStorage.getItem('tree-app-api-key') || '';
    const model = localStorage.getItem('tree-app-model') || 'deepseek-v4-pro';
    const baseUrl = localStorage.getItem('tree-app-base-url') || 'https://api.deepseek.com/anthropic';
    return { apiKey, model, baseUrl };
  } catch {
    return { apiKey: '', model: 'deepseek-v4-pro', baseUrl: 'https://api.deepseek.com/anthropic' };
  }
}

function saveApiKey(key: string) {
  try { localStorage.setItem('tree-app-api-key', key); } catch {}
}

function saveModel(model: string) {
  try { localStorage.setItem('tree-app-model', model); } catch {}
}

function saveBaseUrl(url: string) {
  try { localStorage.setItem('tree-app-base-url', url); } catch {}
}

const TREE_STORAGE_KEY = 'tree-app-data';

function loadTreeFromStorage(): { nodes: Record<string, TreeNode>; rootId: string; title: string } | null {
  try {
    const raw = localStorage.getItem(TREE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { nodes: Record<string, TreeNode>; rootId: string; title: string };
    if (!data.nodes || !data.rootId || !data.title) return null;
    return data;
  } catch {
    return null;
  }
}

function saveTreeToStorage(nodes: Record<string, TreeNode>, rootId: string, title: string) {
  try {
    const json = JSON.stringify({ nodes, rootId, title });
    if (json.length > 4.5 * 1024 * 1024) {
      console.warn('Tree data approaching localStorage limit (5MB)');
    }
    localStorage.setItem(TREE_STORAGE_KEY, json);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('Tree data exceeds localStorage quota. Please export manually.');
    }
  }
}

const saved = loadTreeFromStorage();
const sample = createSampleTree();
const settings = loadSettings();

let initialNodes: Record<string, TreeNode>;
let initialRootId: string;
let initialTitle: string;

if (saved) {
  // Run migration if loaded data has legacy (combined Q&A) nodes
  const hasLegacy = Object.values(saved.nodes).some((n) => !n.type);
  if (hasLegacy) {
    const migrated = migrateLegacyNodes(saved.nodes);
    initialNodes = migrated.nodes;
    initialRootId = migrated.rootId;
  } else {
    initialNodes = saved.nodes;
    initialRootId = saved.rootId;
  }
  initialTitle = saved.title;
} else {
  initialNodes = sample.nodes;
  initialRootId = sample.rootId;
  initialTitle = sample.metadata.title;
}

let saveTimer: ReturnType<typeof setTimeout>;

export const useTreeStore = create<TreeState>((set, get) => ({
  nodes: initialNodes,
  rootId: initialRootId,
  title: initialTitle,
  selectedNodeId: initialRootId,
  collapsedIds: new Set<string>(),
  isStreaming: false,
  suggestedQuestions: [],
  apiKey: settings.apiKey,
  model: settings.model,
  baseUrl: settings.baseUrl,

  selectNode: (id) => set({ selectedNodeId: id, suggestedQuestions: [] }),

  addNode: (type, parentId, text) => {
    const node = createNode(type, text, parentId);
    set((state) => {
      const parent = state.nodes[parentId];
      if (!parent) return state;
      return {
        nodes: {
          ...state.nodes,
          [node.id]: node,
          [parentId]: {
            ...parent,
            children: [...parent.children, node.id],
            updatedAt: Date.now(),
          },
        },
        selectedNodeId: node.id,
      };
    });
    return node.id;
  },

  deleteNode: (nodeId) => {
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;

      const descendantIds = getDescendantIds(state.nodes, nodeId);
      const idsToRemove = new Set([nodeId, ...descendantIds]);

      const newNodes = { ...state.nodes };
      for (const id of idsToRemove) {
        delete newNodes[id];
      }

      if (node.parentId && newNodes[node.parentId]) {
        newNodes[node.parentId] = {
          ...newNodes[node.parentId],
          children: newNodes[node.parentId].children.filter((id) => id !== nodeId),
          updatedAt: Date.now(),
        };
      }

      let selected = state.selectedNodeId;
      if (idsToRemove.has(selected!)) {
        selected = node.parentId || state.rootId;
        if (!newNodes[selected!]) selected = state.rootId;
      }

      return { nodes: newNodes, selectedNodeId: selected };
    });
  },

  updateNode: (nodeId, data) => {
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: {
            ...node,
            ...(data.question !== undefined ? { question: data.question } : {}),
            ...(data.answer !== undefined ? { answer: data.answer } : {}),
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  updateNodePosition: (nodeId, position) => {
    set((state) => {
      const node = state.nodes[nodeId];
      if (!node) return state;
      return {
        nodes: {
          ...state.nodes,
          [nodeId]: { ...node, position, updatedAt: Date.now() },
        },
      };
    });
  },

  toggleCollapse: (nodeId) => {
    set((state) => {
      const next = new Set(state.collapsedIds);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return { collapsedIds: next };
    });
  },

  importTree: (data) => {
    // Migrate on import if needed
    let nodes = data.nodes;
    let rootId = data.rootId;
    const hasLegacy = Object.values(nodes).some((n) => !n.type);
    if (hasLegacy) {
      const migrated = migrateLegacyNodes(nodes);
      nodes = migrated.nodes;
      rootId = migrated.rootId;
    }
    set({
      nodes,
      rootId,
      title: data.metadata.title,
      selectedNodeId: rootId,
      collapsedIds: new Set<string>(),
    });
  },

  exportTree: () => {
    const state = get();
    downloadJSON({
      nodes: state.nodes,
      rootId: state.rootId,
      metadata: {
        title: state.title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
  },

  newTree: () => {
    const rootNode = createNode('question', '', null);
    set({
      nodes: { [rootNode.id]: rootNode },
      rootId: rootNode.id,
      title: '新的学习树',
      selectedNodeId: rootNode.id,
      collapsedIds: new Set<string>(),
    });
  },

  setApiKey: (key) => {
    saveApiKey(key);
    set({ apiKey: key });
  },

  setModel: (model) => {
    saveModel(model);
    set({ model });
  },

  setBaseUrl: (url) => {
    saveBaseUrl(url);
    set({ baseUrl: url });
  },

  setTitle: (title) => set({ title }),

  askQuestion: async (question) => {
    const state = get();
    if (!state.apiKey) {
      throw new Error('请先配置 API Key');
    }
    if (!state.selectedNodeId) {
      throw new Error('请先选择一个节点');
    }

    const selectedNode = state.nodes[state.selectedNodeId];
    if (!selectedNode) {
      throw new Error('选中的节点不存在');
    }

    // Special case: root Question node with empty question (new tree)
    if (selectedNode.type === 'question' && !selectedNode.question) {
      // Fill in the root question
      set((s) => ({
        nodes: {
          ...s.nodes,
          [selectedNode.id]: {
            ...selectedNode,
            question,
            updatedAt: Date.now(),
          },
        },
      }));
      // Proceed to create answer using the root as parent
    }

    // Can only ask from Answer nodes (or root Question that was just filled)
    const currentNode = get().nodes[get().selectedNodeId!];
    if (currentNode.type === 'question' && currentNode.question && currentNode.parentId !== null) {
      throw new Error('请先选择一个回答节点来延伸提问');
    }

    set({ isStreaming: true });

    // Determine parent for the new Question node
    // If we just filled the root Q, use the root Q as parent
    // If selected is an Answer node, use it as parent
    let parentId: string;
    if (currentNode.type === 'question' && !currentNode.parentId) {
      // Root Q that was just filled - the new question goes under root
      // Actually: root Q was just filled, now we need an Answer under it
      parentId = currentNode.id;
    } else {
      // Selected node is an Answer - create Q under it
      parentId = currentNode.id;
    }

    // Create Question node
    const qNode = createNode('question', question, parentId);
    // Create Answer node (placeholder) under Q
    const aNode = createNode('answer', '', qNode.id);

    // Wire up both nodes to the tree
    set((s) => {
      const parent = s.nodes[parentId];
      if (!parent) return s;
      return {
        nodes: {
          ...s.nodes,
          [qNode.id]: qNode,
          [parentId]: {
            ...parent,
            children: [...parent.children, qNode.id],
            updatedAt: Date.now(),
          },
          [aNode.id]: aNode,
          [qNode.id]: {
            ...qNode,
            children: [aNode.id],
          },
        },
        selectedNodeId: aNode.id,
      };
    });

    try {
      // Build context from the question node (includes Q in messages, not the empty A)
      const contextMessages = getContextPath(get().nodes, qNode.id);
      let fullAnswer = '';
      const generator = streamClaudeResponse(
        get().apiKey, contextMessages, get().model, get().baseUrl
      );

      for await (const chunk of generator) {
        fullAnswer += chunk;
        set((s) => ({
          nodes: {
            ...s.nodes,
            [aNode.id]: {
              ...s.nodes[aNode.id],
              answer: fullAnswer,
              updatedAt: Date.now(),
            },
          },
        }));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      set((s) => ({
        nodes: {
          ...s.nodes,
          [aNode.id]: {
            ...s.nodes[aNode.id],
            answer: `**Error:** ${errorMsg}`,
            updatedAt: Date.now(),
          },
        },
      }));
    } finally {
      set({ isStreaming: false });
    }
  },
}));

// Debounced auto-save
useTreeStore.subscribe((state) => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTreeToStorage(state.nodes, state.rootId, state.title);
  }, 1000);
});
