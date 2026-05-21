import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { getVisibleNodeIds } from '../utils/treeHelpers';
import { autoPositionNodes, getConnectorPath, getCanvasBounds } from '../utils/layoutEngine';
import NodeCard from './NodeCard';

export default function TreeCanvas() {
  const nodes = useTreeStore((s) => s.nodes);
  const rootId = useTreeStore((s) => s.rootId);
  const collapsedIds = useTreeStore((s) => s.collapsedIds);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [dragOffsets, setDragOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const panRef = useRef({ panning: false, sx: 0, sy: 0, sl: 0, st: 0 });

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.15, 2)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.15, 0.25)), []);
  const handleZoomReset = useCallback(() => setZoom(1), []);

  const handleNodeDrag = useCallback((id: string, pos: { x: number; y: number } | null) => {
    setDragOffsets((prev) => {
      if (pos === null) {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }
      if (prev[id]?.x === pos.x && prev[id]?.y === pos.y) return prev;
      return { ...prev, [id]: pos };
    });
  }, []);

  const handlePanMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!containerRef.current) return;
    panRef.current = {
      panning: true,
      sx: e.clientX,
      sy: e.clientY,
      sl: containerRef.current.scrollLeft,
      st: containerRef.current.scrollTop,
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const handleMove = (ev: MouseEvent) => {
      if (!panRef.current.panning) return;
      containerRef.current!.scrollLeft = panRef.current.sl - (ev.clientX - panRef.current.sx);
      containerRef.current!.scrollTop = panRef.current.st - (ev.clientY - panRef.current.sy);
    };
    const handleUp = () => {
      panRef.current.panning = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => Math.max(0.25, Math.min(2, z - e.deltaY * 0.002)));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const autoPositions = useMemo(
    () => autoPositionNodes(nodes, rootId),
    [nodes, rootId]
  );

  const positions: Record<string, { x: number; y: number }> = useMemo(() => {
    const merged = { ...autoPositions };
    for (const [id, node] of Object.entries(nodes)) {
      if (node.position) merged[id] = node.position;
    }
    return merged;
  }, [nodes, autoPositions]);

  const visibleIds = useMemo(
    () => getVisibleNodeIds(nodes, rootId, collapsedIds),
    [nodes, rootId, collapsedIds]
  );

  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  const bounds = useMemo(() => getCanvasBounds(positions), [positions]);

  const displayPositions: Record<string, { x: number; y: number }> = useMemo(() => {
    const ox = bounds.minX;
    const oy = bounds.minY;
    const result: Record<string, { x: number; y: number }> = {};
    for (const id of visibleIds) {
      if (dragOffsets[id]) {
        result[id] = dragOffsets[id];
      } else if (positions[id]) {
        result[id] = { x: positions[id].x - ox, y: positions[id].y - oy };
      }
    }
    return result;
  }, [visibleIds, positions, bounds, dragOffsets]);

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

  const canvasW = Math.max(bounds.width, 800);
  const canvasH = Math.max(bounds.height, 600);

  // Auto-center canvas on first render
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const scrollX = Math.max(0, (canvasW * zoom - el.clientWidth) / 2);
    const scrollY = Math.max(0, (canvasH * zoom - el.clientHeight) / 2);
    el.scrollLeft = scrollX;
    el.scrollTop = scrollY;
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-auto bg-white/30 dark:bg-gray-900/30 cursor-grab active:cursor-grabbing" onMouseDown={handlePanMouseDown}>
      <div style={{ width: canvasW * zoom, height: canvasH * zoom }}>
        <div
          className="relative"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Connectors */}
          <svg
            className="absolute inset-0 pointer-events-none overflow-visible"
            style={{ width: '100%', height: '100%' }}
          >
            {connectors.map((c) => (
              <path
                key={c.key}
                d={c.path}
                fill="none"
                className="stroke-gray-300 dark:stroke-gray-600"
                strokeWidth={1.5 / zoom}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Cards */}
          {visibleIds.map((id) => {
            const node = nodes[id];
            if (!node) return null;
            const pos = displayPositions[id];
            if (!pos) return null;
            return (
              <NodeCard
                key={id}
                node={node}
                position={pos}
                zoom={zoom}
                onDrag={handleNodeDrag}
                boundsOffset={{ x: bounds.minX, y: bounds.minY }}
              />
            );
          })}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-0.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-1 select-none">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.25}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-lg font-medium"
        >
          −
        </button>
        <button
          onClick={handleZoomReset}
          className="px-2 h-8 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors tabular-nums"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 2}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-lg font-medium"
        >
          +
        </button>
      </div>
    </div>
  );
}
