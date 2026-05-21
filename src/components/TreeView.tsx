import { useTreeStore } from '../store/useTreeStore';
import TreeCanvas from './TreeCanvas';

export default function TreeView() {
  const nodes = useTreeStore((s) => s.nodes);
  const rootId = useTreeStore((s) => s.rootId);
  const rootNode = nodes[rootId];

  if (!rootNode) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        树为空，请创建一个新树或导入数据
      </div>
    );
  }

  return <TreeCanvas />;
}
