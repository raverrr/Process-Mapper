import type { XYPosition } from '@xyflow/react';
import type { AppNode } from '../types';
import { getAbsolutePosition, nodeSize } from './geometry';

export type HelperLines = {
  horizontal?: number;
  vertical?: number;
};

const OFFSETS = [0, 0.5, 1] as const;

export function snapToHelpers(
  nodeId: string,
  relativePosition: XYPosition,
  nodes: AppNode[],
  threshold = 6,
): { position: XYPosition; lines: HelperLines } {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || node.type === 'swimlane') {
    return { position: relativePosition, lines: {} };
  }

  const { w, h } = nodeSize(node);
  const parent = node.parentId ? nodes.find((n) => n.id === node.parentId) : undefined;
  const parentAbs = parent ? getAbsolutePosition(parent, nodes) : { x: 0, y: 0 };
  const abs = {
    x: parentAbs.x + relativePosition.x,
    y: parentAbs.y + relativePosition.y,
  };

  let bestV = threshold;
  let bestH = threshold;
  let vertical: number | undefined;
  let horizontal: number | undefined;
  const snap = { ...abs };

  for (const other of nodes) {
    if (other.id === nodeId || other.type === 'swimlane') continue;
    const oAbs = getAbsolutePosition(other, nodes);
    const os = nodeSize(other);

    for (const a of OFFSETS) {
      for (const b of OFFSETS) {
        const oursX = abs.x + w * a;
        const theirsX = oAbs.x + os.w * b;
        const dx = Math.abs(oursX - theirsX);
        if (dx < bestV) {
          bestV = dx;
          vertical = theirsX;
          snap.x = abs.x + (theirsX - oursX);
        }

        const oursY = abs.y + h * a;
        const theirsY = oAbs.y + os.h * b;
        const dy = Math.abs(oursY - theirsY);
        if (dy < bestH) {
          bestH = dy;
          horizontal = theirsY;
          snap.y = abs.y + (theirsY - oursY);
        }
      }
    }
  }

  return {
    position: { x: snap.x - parentAbs.x, y: snap.y - parentAbs.y },
    lines: { horizontal, vertical },
  };
}
