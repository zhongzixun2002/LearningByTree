export interface TreeNode {
  id: string;
  parentId: string | null;
  type: 'question' | 'answer';
  question: string;
  answer: string;
  children: string[];
  position?: { x: number; y: number };
  createdAt: number;
  updatedAt: number;
}

export interface TreeMetadata {
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface TreeData {
  nodes: Record<string, TreeNode>;
  rootId: string;
  metadata: TreeMetadata;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
}
