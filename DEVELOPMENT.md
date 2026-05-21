# Tree Learning App — 项目总结

## 项目定位

一个**树状会话式学习工具**，本质是带记忆和分支的对话系统。用户从根节点提问，AI 回答，从任意回答可继续追问形成分支树。适合深度学习、知识梳理、探索式学习。

## 技术栈

| 层面 | 方案 |
|------|------|
| 框架 | Vite 8 + React 19 + TypeScript 6 |
| 状态管理 | Zustand 5 |
| 样式 | Tailwind CSS 4 + `@tailwindcss/typography` |
| AI API | DeepSeek Anthropic 兼容 API（base_url: `https://api.deepseek.com/anthropic`） |
| Markdown | react-markdown + remark-gfm |
| 数据存储 | JSON 文件导入/导出（本地） |

## 项目结构

```
tree-learning-app/
├── src/
│   ├── types/tree.ts              # 核心类型 (TreeNode, TreeData, Message)
│   ├── store/useTreeStore.ts      # Zustand 状态管理 (树操作 + AI 对话 + 设置)
│   ├── api/claude.ts              # Anthropic API 流式调用 (可配 baseUrl)
│   ├── utils/treeHelpers.ts       # 树操作工具 (创建节点、构建上下文、导出)
│   ├── components/
│   │   ├── TreeView.tsx           # 树容器，判断空状态
│   │   ├── TreeNode.tsx           # 递归树节点 + SVG 连线 + React.memo
│   │   ├── NodeDetail.tsx         # 节点详情查看/编辑/删除 + Markdown 渲染
│   │   ├── ChatInput.tsx          # 追问输入框 (Enter 发送)
│   │   ├── Toolbar.tsx            # 工具栏 (新建/导入/导出/API设置)
│   │   └── SettingsDialog.tsx     # API Key / Base URL / 模型配置
│   ├── App.tsx                    # 主布局 (可拖拽分割面板)
│   ├── main.tsx
│   └── index.css                  # Tailwind + 自定义排版 (代码块、表格、引用)
```

## 核心数据结构

```typescript
interface TreeNode {
  id: string;
  parentId: string | null;
  question: string;
  answer: string;           // Markdown 格式
  children: string[];       // 子节点 ID 列表
  createdAt: number;
  updatedAt: number;
}

interface TreeData {
  nodes: Record<string, TreeNode>;
  rootId: string;
  metadata: { title, createdAt, updatedAt };
}
```

## 已实现功能

### 核心交互
- [x] 可视化树状结构（flexbox 递归渲染 + SVG 连线）
- [x] 点击节点切换详情
- [x] 折叠/展开子树
- [x] 从任意节点延伸提问
- [x] 节点编辑（修改 Q&A 内容）
- [x] 节点删除（含子树确认弹窗）
- [x] 可拖拽分割面板（知识树 ↔ 详情区）

### AI 对话
- [x] Claude API 流式调用（Anthropic 格式）
- [x] 可配置 Base URL（默认 DeepSeek）
- [x] 上下文传递（从根节点到当前节点的完整路径）
- [x] 流式输出实时渲染
- [x] API Key localStorage 持久化
- [x] 多模型选择

### 数据持久化
- [x] JSON 导出（下载文件）
- [x] JSON 导入（文件选择器）
- [x] 新建空白树

### UI/UX
- [x] 暗色模式支持
- [x] Markdown 代码块（语言标签 + 复制按钮）
- [x] 表格、引用、列表美观渲染
- [x] 自定义滚动条
- [x] 选中节点高亮 + 动画

## 运行方式

```bash
cd tree-learning-app
npm run dev      # 开发服务器 → http://localhost:5173
npm run build    # 生产构建
npm run preview  # 预览生产构建
```

## 当前问题 / 待改进

### Bug
- **dev server 偶发崩溃**：background task 之前 exit code 4，需重启 `npm run dev`

### 可扩展方向
1. **拖拽排序** — 在树中拖拽节点改变父子关系
2. **搜索节点** — 全局搜索过滤树节点
3. **多标签/多树** — 同时打开多个学习树
4. **自动保存** — 定期自动保存到 localStorage 或文件
5. **导出优化** — 支持导出为 Markdown/HTML 格式
6. **节点图标** — 根据内容类型自动添加 emoji/图标
7. **性能优化** — 对大树的虚拟滚动或懒加载
8. **快捷键** — 键盘导航（方向键切换节点、Ctrl+Enter 发送等）
9. **历史记录** — 操作撤销/重做
