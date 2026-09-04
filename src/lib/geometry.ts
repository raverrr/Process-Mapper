import type { XYPosition } from '@xyflow/react';
import { SWIMLANE_LABEL_WIDTH, SWIMLANE_WIDTH } from '../constants';
import type { AppNode, SwimlaneNode } from '../types';

export function nodeSize(node: AppNode): { w: number; h: number } {
  const measured = node.measured;
  if (measured?.width && measured.height) {
    return { w: measured.width, h: measured.height };
  }
  const style = node.style;
  const w = typeof style?.width === 'number' ? style.width : Number(style?.width) || 160;
  const h = typeof style?.height === 'number' ? style.height : Number(style?.height) || 80;
  return { w, h };
}

export function getAbsolutePosition(node: AppNode, nodes: AppNode[]): XYPosition {
  let x = node.position.x;
  let y = node.position.y;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let current: AppNode | undefined = node;
  const guard = new Set<string>();
  while (current?.parentId) {
    if (guard.has(current.id)) break;
    guard.add(current.id);
    const parent = byId.get(current.parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    current = parent;
  }
  return { x, y };
}

export function sortParentsFirst(nodes: AppNode[]): AppNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const out: AppNode[] = [];

  const visit = (n: AppNode) => {
    if (visited.has(n.id)) return;
    visited.add(n.id);
    if (n.parentId) {
      const parent = byId.get(n.parentId);
      if (parent) visit(parent);
    }
    out.push(n);
  };

  for (const n of nodes) visit(n);
  return out;
}

export function detachFromParent(node: AppNode, nodes: AppNode[]): AppNode {
  if (!node.parentId) return node;
  const abs = getAbsolutePosition(node, nodes);
  return { ...node, parentId: undefined, position: abs };
}

export function attachToLane(node: AppNode, lane: SwimlaneNode, nodes: AppNode[]): AppNode {
  const abs = getAbsolutePosition(node, nodes);
  const laneAbs = getAbsolutePosition(lane, nodes);
  return {
    ...node,
    parentId: lane.id,
    position: {
      x: Math.max(SWIMLANE_LABEL_WIDTH + 8, abs.x - laneAbs.x),
      y: Math.max(12, abs.y - laneAbs.y),
    },
  };
}

export function laneAtPoint(point: XYPosition, nodes: AppNode[]): SwimlaneNode | undefined {
  const lanes = nodes.filter((n): n is SwimlaneNode => n.type === 'swimlane');
  for (let i = lanes.length - 1; i >= 0; i -= 1) {
    const lane = lanes[i];
    const { w, h } = nodeSize(lane);
    const p = getAbsolutePosition(lane, nodes);
    if (point.x >= p.x && point.x <= p.x + w && point.y >= p.y && point.y <= p.y + h) {
      return lane;
    }
  }
  return undefined;
}

export function maxSwimlaneWidth(nodes: AppNode[]): number {
  const lanes = nodes.filter((node): node is SwimlaneNode => node.type === 'swimlane');
  if (!lanes.length) return SWIMLANE_WIDTH;
  return Math.max(...lanes.map((lane) => nodeSize(lane).w));
}

export function applyEqualSwimlaneWidth(nodes: AppNode[], width: number): AppNode[] {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.type !== 'swimlane') return node;
    const current = nodeSize(node).w;
    const styleWidth = node.style?.width;
    if (current === width && styleWidth === width) return node;
    changed = true;
    return {
      ...node,
      width,
      style: { ...node.style, width },
      measured: node.measured ? { ...node.measured, width } : node.measured,
    };
  });
  return changed ? next : nodes;
}

export function nextSwimlanePosition(nodes: AppNode[]): XYPosition {
  const lanes = nodes.filter((n) => n.type === 'swimlane');
  if (lanes.length === 0) return { x: 0, y: 0 };
  let maxBottom = 0;
  let minX = lanes[0].position.x;
  for (const lane of lanes) {
    const { h } = nodeSize(lane);
    const abs = getAbsolutePosition(lane, nodes);
    maxBottom = Math.max(maxBottom, abs.y + h);
    minX = Math.min(minX, abs.x);
  }
  return { x: minX, y: maxBottom + 16 };
}
