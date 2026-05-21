import { memo, useEffect, useRef } from 'react';
import { useTreeStore } from '../store/useTreeStore';
import type { TreeNode as TreeNodeType } from '../types/tree';

const TreeNodeCard = memo(function TreeNodeCard({ node }: { node: TreeNodeType }) {
  const selectedNodeId = useTreeStore((s) => s.selectedNodeId);
  const selectNode = useTreeStore((s) => s.selectNode);
  const toggleCollapse = useTreeStore((s) => s.toggleCollapse);
  const collapsedIds = useTreeStore((s) => s.collapsedIds);

  const isSelected = selectedNodeId === node.id;
  const isCollapsed = collapsedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isQuestion = node.type === 'question';

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [isSelected]);

  const typeColors = isQuestion
    ? 'border-l-indigo-400 bg-gradient-to-r from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-gray-800/80'
    : 'border-l-emerald-400 bg-gradient-to-r from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-gray-800/80';

  const emptyText = isQuestion ? '在此提问...' : '等待回答...';

  return (
    <div
      ref={cardRef}
      className={`
        relative px-3 py-2.5 rounded-xl border border-l-[3px] text-sm cursor-pointer select-none
        transition-all duration-200
        ${typeColors}
        ${isSelected
          ? '!border-l-blue-500 !border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/15 z-10 ring-2 ring-blue-500/30'
          : 'border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
        }
      `}
      style={{ width: 180 }}
      onClick={() => selectNode(node.id)}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
          ${isQuestion
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
          }`}>
          {isQuestion ? 'Q' : 'A'}
        </span>
      </div>
      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-200 leading-snug line-clamp-3 text-left">
        {isQuestion
          ? (node.question || <span className="text-gray-300 dark:text-gray-600 italic">{emptyText}</span>)
          : (node.answer
            ? <span className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-400">{node.answer.slice(0, 80)}{node.answer.length > 80 ? '...' : ''}</span>
            : <span className="text-gray-300 dark:text-gray-600 italic">{emptyText}</span>)
        }
      </div>

      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse(node.id);
          }}
          className="absolute -right-2 -top-2 w-5 h-5 rounded-full
                     bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300
                     flex items-center justify-center
                     hover:bg-gray-300 dark:hover:bg-gray-500
                     transition-colors cursor-pointer shadow-sm"
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
      )}
    </div>
  );
});

function Subtree({ nodeId }: { nodeId: string }) {
  const nodes = useTreeStore((s) => s.nodes);
  const collapsedIds = useTreeStore((s) => s.collapsedIds);

  const node = nodes[nodeId];
  if (!node) return null;

  const isCollapsed = collapsedIds.has(node.id);
  const children = node.children.filter((id) => nodes[id]);

  return (
    <div className="flex flex-col items-center">
      <TreeNodeCard node={node} />

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isCollapsed ? '0px' : '2000px',
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        {children.length > 0 && (
          <>
            {/* Vertical line down from parent */}
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />

            {/* Children row with horizontal connector */}
            <div className="relative flex items-start">
              {/* Horizontal bar spanning all children */}
              <div className="absolute inset-x-0 top-0 h-px bg-gray-200 dark:bg-gray-700" />

              <div className="flex gap-8 pt-5">
                {children.map((childId) => (
                  <div key={childId} className="flex flex-col items-center relative">
                    {/* Vertical line up from this child */}
                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                    <Subtree nodeId={childId} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TreeNode({ node }: { node: TreeNodeType }) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex justify-center pt-4">
        <Subtree nodeId={node.id} />
      </div>
    </div>
  );
}
