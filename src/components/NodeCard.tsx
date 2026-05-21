import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import type { TreeNode } from '../types/tree';
import { t } from '../i18n/en';

const Q_CARD_W = 160;
const Q_CARD_H = 50;
const A_CARD_W = 220;
const A_CARD_H = 90;
const DRAG_THRESHOLD = 4;

function NodeCard({
  node,
  position,
  zoom,
  onDrag,
  boundsOffset,
}: {
  node: TreeNode;
  position: { x: number; y: number };
  zoom: number;
  onDrag?: (id: string, pos: { x: number; y: number } | null) => void;
  boundsOffset: { x: number; y: number };
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
  const justDragged = useRef(false);

  useEffect(() => {
    if (isSelected && cardRef.current && !justDragged.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
    justDragged.current = false;
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
        const displayX = dragState.current.moved
          ? (finalPos?.x ?? dragState.current.px)
          : position.x;
        const displayY = dragState.current.moved
          ? (finalPos?.y ?? dragState.current.py)
          : position.y;
        if (dragState.current.moved) {
          justDragged.current = true;
          // Convert display coordinates back to absolute coordinates
          updateNodePosition(node.id, { x: displayX + boundsOffset.x, y: displayY + boundsOffset.y });
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

  const cardW = isQuestion ? Q_CARD_W : A_CARD_W;
  const cardH = isQuestion ? Q_CARD_H : A_CARD_H;

  const typeColors = isQuestion
    ? 'border-l-indigo-400 bg-white dark:bg-gray-800/90'
    : 'border-l-emerald-400 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-gray-800/80';

  const cardRadius = isQuestion ? 'rounded-2xl' : 'rounded-xl';

  const emptyText = isQuestion ? t.clickToExplore : t.waitingAI;

  return (
    <div
      ref={cardRef}
      className={`
        absolute border border-l-[3px] cursor-pointer select-none
        transition-shadow duration-200 ${cardRadius}
        ${typeColors}
        ${isSelected
          ? '!border-l-blue-500 !border-blue-500 shadow-lg shadow-blue-500/15 z-10 ring-2 ring-blue-500/30'
          : 'border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
        }
      `}
      style={{
        left: displayPos.x,
        top: displayPos.y,
        width: cardW,
        minHeight: cardH,
      }}
      onMouseDown={handleMouseDown}
      onClick={() => { if (!dragState.current.moved) selectNode(node.id); }}
    >
      <div className={isQuestion ? 'px-3 py-2' : 'px-3 py-2.5'}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
            ${isQuestion
              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
            }`}>
            {isQuestion ? 'Q' : 'A'}
          </span>
          {!isQuestion && node.answer && (
            <span className="text-[9px] text-gray-400 ml-auto">{node.answer.length} {t.chars}</span>
          )}
          {dragState.current.dragging && dragState.current.moved ? (
            <span className="text-[9px] text-gray-400 ml-auto">{t.dragging}</span>
          ) : null}
        </div>
        {isQuestion ? (
          <div className="text-[14px] font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-1">
            {node.question || <span className="text-gray-300 dark:text-gray-600 italic">{emptyText}</span>}
          </div>
        ) : (
          <div className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-3">
            {node.answer
              ? node.answer.slice(0, 120) + (node.answer.length > 120 ? '...' : '')
              : <span className="text-gray-300 dark:text-gray-600 italic">{emptyText}</span>}
          </div>
        )}
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
