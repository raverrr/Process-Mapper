import type { XYPosition } from '@xyflow/react';
import type { AppNode } from '../types';
import { getAbsolutePosition, nodeSize } from './geometry';

export type HelperLines = {
  horizontal?: number;
  vertical?: number;
};

export const GRID_SIZE = 8;
export const HELPER_THRESHOLD = 12;

export function snapToHelpers(
  nodeId: string,
  relativePosition: XYPosition,
  nodes: AppNode[],
  threshold = HELPER_THRESHOLD,
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

  const matchX = (anchors: readonly number[]) => {
    for (const other of nodes) {
      if (other.id === nodeId || other.type === 'swimlane') continue;
      const oAbs = getAbsolutePosition(other, nodes);
      const os = nodeSize(other);
      for (const anchor of anchors) {
        const oursX = abs.x + w * anchor;
        const theirsX = oAbs.x + os.w * anchor;
        const dx = Math.abs(oursX - theirsX);
        if (dx <= bestV) {
          bestV = dx;
          vertical = theirsX;
          snap.x = abs.x + (theirsX - oursX);
        }
      }
    }
  };

  const matchY = (anchors: readonly number[]) => {
    for (const other of nodes) {
      if (other.id === nodeId || other.type === 'swimlane') continue;
      const oAbs = getAbsolutePosition(other, nodes);
      const os = nodeSize(other);
      for (const anchor of anchors) {
        const oursY = abs.y + h * anchor;
        const theirsY = oAbs.y + os.h * anchor;
        const dy = Math.abs(oursY - theirsY);
        if (dy <= bestH) {
          bestH = dy;
          horizontal = theirsY;
          snap.y = abs.y + (theirsY - oursY);
        }
      }
    }
  };

  matchX([0.5]);
  if (vertical == null) matchX([0, 1]);
  matchY([0.5]);
  if (horizontal == null) matchY([0, 1]);

  return {
    position: { x: snap.x - parentAbs.x, y: snap.y - parentAbs.y },
    lines: { horizontal, vertical },
  };
}

/** Snap so the node's center (connector anchors) lands on the grid, not its top-left. */
export function snapCenterToGrid(
  position: XYPosition,
  size: { w: number; h: number },
  grid = GRID_SIZE,
): XYPosition {
  const cx = position.x + size.w / 2;
  const cy = position.y + size.h / 2;
  return {
    x: Math.round(cx / grid) * grid - size.w / 2,
    y: Math.round(cy / grid) * grid - size.h / 2,
  };
}

export function snapPosition(
  nodeId: string,
  relativePosition: XYPosition,
  nodes: AppNode[],
): { position: XYPosition; lines: HelperLines } {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node || node.type === 'swimlane') {
    return { position: relativePosition, lines: {} };
  }
  const helpers = snapToHelpers(nodeId, relativePosition, nodes);
  const gridded = snapCenterToGrid(relativePosition, nodeSize(node));
  return {
    position: {
      x: helpers.lines.vertical != null ? helpers.position.x : gridded.x,
      y: helpers.lines.horizontal != null ? helpers.position.y : gridded.y,
    },
    lines: helpers.lines,
  };
}
