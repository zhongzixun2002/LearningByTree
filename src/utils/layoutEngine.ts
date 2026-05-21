import type { TreeNode } from '../types/tree';

const Q_CARD_W = 160;
const Q_CARD_H = 50;
const A_CARD_W = 220;
const A_CARD_H = 90;
const H_GAP = 240;
const V_GAP = 160;

interface Point {
  x: number;
  y: number;
}

export function autoPositionNodes(
  nodes: Record<string, TreeNode>,
  rootId: string
): Record<string, Point> {
  const positions: Record<string, Point> = {};

  function layout(nodeId: string, depth: number, left: number, right: number): number {
    const node = nodes[nodeId];
    if (!node) return left;

    const children = node.children.filter((id) => nodes[id]);
    const x = (left + right) / 2;
    const y = depth * V_GAP + 40;

    positions[nodeId] = { x, y };

    if (children.length === 0) return left;

    const width = (right - left) / children.length;
    for (let i = 0; i < children.length; i++) {
      const childLeft = left + i * width;
      const childRight = childLeft + width;
      layout(children[i], depth + 1, childLeft, childRight);
    }

    return left;
  }

  layout(rootId, 0, 0, 1200);
  return positions;
}

export function getChildPosition(
  parentPos: Point,
  existingChildren: string[],
): Point {
  // Place new child below parent, horizontally offset based on existing count
  const count = existingChildren.length;
  const offsetX = (count - 1) * (H_GAP / 2);
  return {
    x: parentPos.x + offsetX - (count > 0 ? 0 : 0),
    y: parentPos.y + V_GAP,
  };
}

export function getConnectorPath(
  from: Point, to: Point,
  fromType: 'question' | 'answer' = 'question',
  toType: 'question' | 'answer' = 'question'
): string {
  const fromW = fromType === 'question' ? Q_CARD_W : A_CARD_W;
  const fromH = fromType === 'question' ? Q_CARD_H : A_CARD_H;
  const toW = toType === 'question' ? Q_CARD_W : A_CARD_W;
  const x1 = from.x + fromW / 2;
  const y1 = from.y + fromH;
  const x2 = to.x + toW / 2;
  const y2 = to.y;
  const dy = Math.max(Math.abs(y2 - y1) * 0.5, 40);
  return `M ${x1} ${y1} C ${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2}`;
}

export function getCanvasBounds(
  positions: Record<string, Point>
): { minX: number; minY: number; width: number; height: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const pos of Object.values(positions)) {
    if (pos.x < minX) minX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.x + A_CARD_W > maxX) maxX = pos.x + A_CARD_W;
    if (pos.y + A_CARD_H > maxY) maxY = pos.y + A_CARD_H;
  }

  const padding = 100;
  return {
    minX: minX - padding,
    minY: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}
