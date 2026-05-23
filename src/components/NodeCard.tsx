import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import type { TreeNode } from '../types/tree';

const CARD_W = 180;
const CARD_H = 80;
const DRAG_THRESHOLD = 4;

function NodeCard({
  node,
  position,
  zoom,
  onDrag,
}: {
  node: TreeNode;
  position: { x: number; y: number };
  zoom: number;
  onDrag?: (id: string, pos: { x: number; y: number } | null) => void;
}) {
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const selectNode = useTreeStore((s) => s.selectNode);
  const toggleCollapse = useTreeStore((s) => s.toggleCollapse);
  const collapsedIds = useTreeStore((s) => s.collapsedIds);
  const updateNodePosition = useTreeStore((s) => s.updateNodePosition);

  const isSelected = selectedNodeId === node.id;
  const isCollapsed = collapsedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isQuestion = node.type === 'question';

  const cardRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ dragging: false, moved: false, sx: 0, sy: 0, px: 0, py: 0 });
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [isSelected]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dragState.current = {
      dragging: true,
      moved: false,
      sx: e.clientX,
      sy: e.clientY,
      px: position.x,
      py: position.y,
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const handleMove = (ev: MouseEvent) => {
      if (!dragState.current.dragging) return;
      const dx = (ev.clientX - dragState.current.sx) / zoom;
      const dy = (ev.clientY - dragState.current.sy) / zoom;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        dragState.current.moved = true;
      }
      const newPos = {
        x: dragState.current.px + dx,
        y: dragState.current.py + dy,
      };
      dragPosRef.current = newPos;
      setDragPos(newPos);
      onDrag?.(node.id, newPos);
    };

    const handleUp = () => {
      if (dragState.current.dragging) {
        const finalPos = dragPosRef.current;
        const dx = dragState.current.moved
          ? (finalPos?.x ?? dragState.current.px)
          : position.x;
        const dy = dragState.current.moved
          ? (finalPos?.y ?? dragState.current.py)
          : position.y;
        if (dragState.current.moved) {
          updateNodePosition(node.id, { x: dx, y: dy });
        }
        onDrag?.(node.id, null);
        dragPosRef.current = null;
        setDragPos(null);
        dragState.current.dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [node.id, position, zoom, updateNodePosition, onDrag]);

  const displayPos = dragPos ?? position;

  const typeColors = isQuestion
    ? 'border-l-indigo-400 bg-gradient-to-r from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-gray-800/80'
    : 'border-l-emerald-400 bg-gradient-to-r from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-gray-800/80';

  const emptyText = isQuestion ? '点击提问' : '等待回答';

  return (
    <div
      ref={cardRef}
      className={`
        absolute rounded-xl border border-l-[3px] text-sm cursor-pointer select-none
        transition-shadow duration-200
        ${typeColors}
        ${isSelected
          ? '!border-l-blue-500 !border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/15 z-10 ring-2 ring-blue-500/30'
          : 'border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
        }
      `}
      style={{
        left: displayPos.x,
        top: displayPos.y,
        width: CARD_W,
        minHeight: CARD_H,
      }}
      onMouseDown={handleMouseDown}
      onClick={() => { if (!dragState.current.moved) selectNode(node.id); }}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
            ${isQuestion
              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
            }`}>
            {isQuestion ? 'Q' : 'A'}
          </span>
          {dragState.current.dragging && dragState.current.moved ? (
            <span className="text-[9px] text-gray-400 ml-auto">拖动中</span>
          ) : null}
        </div>
        <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 text-left">
          {isQuestion
            ? (node.question || <span className="text-gray-300 dark:text-gray-600 italic">{emptyText}</span>)
            : (node.answer
              ? <span className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-400">{node.answer.slice(0, 60)}{node.answer.length > 60 ? '...' : ''}</span>
              : <span className="text-gray-300 dark:text-gray-600 italic">{emptyText}</span>)
          }
        </div>
      </div>

      {hasChildren ? (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse(node.id);
          }}
          className="absolute -right-2 -top-2 w-5 h-5 rounded-full
                     bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300
                     flex items-center justify-center
                     hover:bg-gray-300 dark:hover:bg-gray-500
                     transition-colors cursor-pointer shadow-sm z-20"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d={isCollapsed ? 'M5 2v6M2 5h6' : 'M2 5h6'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

export default memo(NodeCard);
