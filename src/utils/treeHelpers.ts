import type { TreeNode, TreeData, Message } from '../types/tree';

let idCounter = 0;
export function generateId(): string {
  return `node_${Date.now()}_${++idCounter}`;
}

export function createNode(
  type: 'question' | 'answer',
  text: string,
  parentId: string | null
): TreeNode {
  const now = Date.now();
  return {
    id: generateId(),
    parentId,
    type,
    question: type === 'question' ? text : '',
    answer: type === 'answer' ? text : '',
    children: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getContextPath(
  nodes: Record<string, TreeNode>,
  nodeId: string
): Message[] {
  const messages: Message[] = [];
  const path: TreeNode[] = [];
  let current = nodes[nodeId];
  if (!current) return messages;

  while (current) {
    path.unshift(current);
    if (!current.parentId) break;
    current = nodes[current.parentId];
    if (!current) break;
  }

  for (const node of path) {
    if (node.question) {
      messages.push({ role: 'user', content: node.question });
    }
    if (node.answer) {
      messages.push({ role: 'assistant', content: node.answer });
    }
  }

  return messages;
}

export function getDescendantIds(
  nodes: Record<string, TreeNode>,
  nodeId: string
): string[] {
  const result: string[] = [];
  const stack = [nodeId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const node = nodes[id];
    if (node) {
      for (const childId of node.children) {
        result.push(childId);
        stack.push(childId);
      }
    }
  }
  return result;
}

export function getVisibleNodeIds(
  nodes: Record<string, TreeNode>,
  rootId: string,
  collapsedIds: Set<string>
): string[] {
  const result: string[] = [];
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const node = nodes[id];
    if (!node) continue;
    result.push(id);
    if (!collapsedIds.has(id)) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        const childId = node.children[i];
        if (nodes[childId]) stack.push(childId);
      }
    }
  }
  return result;
}

export function migrateLegacyNodes(
  nodes: Record<string, TreeNode>
): { nodes: Record<string, TreeNode>; rootId: string } {
  const newNodes: Record<string, TreeNode> = { ...nodes };
  let rootId = '';

  for (const [id, node] of Object.entries(nodes)) {
    if (node.type) continue; // Already migrated

    const isRoot = node.parentId === null;
    if (isRoot) rootId = id;

    // Create Q node (takes over the old node's position)
    const qNode: TreeNode = {
      ...node,
      type: 'question',
      question: node.question,
      answer: '',
      children: [],
    };

    // Create A node (child of Q, gets old node's children)
    const aNode = createNode('answer', node.answer, id);
    aNode.id = generateId();
    aNode.children = [...node.children];
    aNode.createdAt = node.createdAt;
    aNode.updatedAt = node.updatedAt;

    // Q node has A node as only child
    qNode.children = [aNode.id];

    newNodes[id] = qNode;
    newNodes[aNode.id] = aNode;

    // Reparent old children to A node
    for (const childId of node.children) {
      if (newNodes[childId]) {
        newNodes[childId] = { ...newNodes[childId], parentId: aNode.id };
      }
    }
  }

  return { nodes: newNodes, rootId };
}

export function createSampleTree(): TreeData {
  const now = Date.now();

  // Q: root
  const rootQ = createNode('question', '什么是 JavaScript 闭包？', null);
  // A: root answer
  const rootA = createNode('answer',
    '闭包是指一个函数可以访问其外部作用域中的变量，即使外部函数已经返回。\n\n```js\nfunction outer(x) {\n  return function inner(y) {\n    return x + y;\n  };\n}\nconst add5 = outer(5);\nconsole.log(add5(3)); // 8\n```\n\n这非常有用，可以创建私有变量和函数工厂。',
    rootQ.id
  );

  // Q: follow-up 1 from root answer
  const q1 = createNode('question', '闭包在实际开发中有什么应用场景？', rootA.id);
  // A: follow-up 1 answer
  const a1 = createNode('answer',
    '闭包的常见应用场景包括：\n1. **封装私有变量** — 模拟私有属性和方法\n2. **函数工厂** — 创建带预设参数的回调函数\n3. **事件处理** — 在循环中正确捕获变量\n4. **模块模式** — 实现命名空间和模块化',
    q1.id
  );

  // Q: follow-up 2 from root answer (another follow-up from same answer)
  const q2 = createNode('question', '闭包和箭头函数有什么关系？', rootA.id);
  // A: follow-up 2 answer
  const a2 = createNode('answer',
    '箭头函数和闭包关系密切：箭头函数会捕获定义时的 `this` 值（词法作用域），本质上就是闭包的一种表现。\n\n关键区别：\n- `function` 关键字创建的函数有自己的 `this`\n- 箭头函数没有自己的 `this`，会从外层作用域继承',
    q2.id
  );

  // Q: deeper follow-up from a1
  const q1a = createNode('question', '可以给一个封装私有变量的代码示例吗？', a1.id);
  // A: deeper follow-up answer
  const a1a = createNode('answer',
    '当然！\n\n```js\nfunction createCounter() {\n  let count = 0; // 私有变量\n  return {\n    increment: () => ++count,\n    decrement: () => --count,\n    getCount: () => count,\n  };\n}\n\nconst counter = createCounter();\ncounter.increment(); // 1\ncounter.increment(); // 2\nconsole.log(counter.getCount()); // 2\n// 无法直接访问 count\n```\n\n这里 `count` 就是私有变量，只能通过返回的对象方法访问。',
    q1a.id
  );

  // Wire up children
  rootQ.children = [rootA.id];
  rootA.children = [q1.id, q2.id];
  q1.children = [a1.id];
  a1.children = [q1a.id];
  q1a.children = [a1a.id];
  a1a.children = [];
  q2.children = [a2.id];
  a2.children = [];

  const nodes: Record<string, TreeNode> = {
    [rootQ.id]: rootQ,
    [rootA.id]: rootA,
    [q1.id]: q1,
    [a1.id]: a1,
    [q2.id]: q2,
    [a2.id]: a2,
    [q1a.id]: q1a,
    [a1a.id]: a1a,
  };

  return {
    nodes,
    rootId: rootQ.id,
    metadata: {
      title: 'JavaScript 闭包学习',
      createdAt: now,
      updatedAt: now,
    },
  };
}

export function downloadJSON(data: TreeData, filename?: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${data.metadata.title || 'tree'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
