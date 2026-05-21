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
              className={isSelected ? 'fill-blue-500' : node.type === 'question' ? 'fill-indigo-400/60' : 'fill-emerald-400/60'}
            />
          );
        })}
      </svg>
    </div>
  );
}
