import { Position } from '@xyflow/react';

export type Box = { x: number; y: number; w: number; h: number };

export type EdgeRoute = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
  axisLocked: boolean;
};

export type HandleAnchor = {
  id?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  position: Position;
};

/** Collinear handles only. Never used to slide endpoints off the anchors. */
export const ALIGN_TOLERANCE = 0.5;

export function handleIdToPosition(id?: string | null): Position | undefined {
  if (id === 't') return Position.Top;
  if (id === 'r') return Position.Right;
  if (id === 'b') return Position.Bottom;
  if (id === 'l') return Position.Left;
  return undefined;
}

export function positionToHandleId(pos: Position): string {
  switch (pos) {
    case Position.Top:
      return 't';
    case Position.Right:
      return 'r';
    case Position.Bottom:
      return 'b';
    case Position.Left:
      return 'l';
    default:
      return 'b';
  }
}

export function sidePoint(box: Box, pos: Position): { x: number; y: number } {
  switch (pos) {
    case Position.Top:
      return { x: box.x + box.w / 2, y: box.y };
    case Position.Right:
      return { x: box.x + box.w, y: box.y + box.h / 2 };
    case Position.Bottom:
      return { x: box.x + box.w / 2, y: box.y + box.h };
    case Position.Left:
      return { x: box.x, y: box.y + box.h / 2 };
    default:
      return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  }
}

export function handleCenter(origin: { x: number; y: number }, handle: HandleAnchor): { x: number; y: number } {
  return {
    x: origin.x + handle.x + handle.width / 2,
    y: origin.y + handle.y + handle.height / 2,
  };
}

export function pickHandle(
  handles: readonly HandleAnchor[] | undefined,
  pos: Position,
  id?: string | null,
): HandleAnchor | undefined {
  if (!handles?.length) return undefined;
  if (id) {
    const byId = handles.find((handle) => handle.id === id);
    if (byId) return byId;
  }
  return handles.find((handle) => handle.position === pos) ?? handles.find((handle) => handle.id === positionToHandleId(pos));
}

export function facingSides(a: Box, b: Box): { sourcePos: Position; targetPos: Position } {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  if (Math.abs(dy) >= Math.abs(dx)) {
    return dy >= 0
      ? { sourcePos: Position.Bottom, targetPos: Position.Top }
      : { sourcePos: Position.Top, targetPos: Position.Bottom };
  }
  return dx >= 0
    ? { sourcePos: Position.Right, targetPos: Position.Left }
    : { sourcePos: Position.Left, targetPos: Position.Right };
}

export function routeAnchors(
  src: { x: number; y: number },
  tgt: { x: number; y: number },
  sourcePos: Position,
  targetPos: Position,
): EdgeRoute {
  const vertical = sourcePos === Position.Top || sourcePos === Position.Bottom;
  const aligned = vertical
    ? Math.abs(src.x - tgt.x) <= ALIGN_TOLERANCE
    : Math.abs(src.y - tgt.y) <= ALIGN_TOLERANCE;
  return {
    sx: src.x,
    sy: src.y,
    tx: tgt.x,
    ty: tgt.y,
    sourcePos,
    targetPos,
    axisLocked: aligned,
  };
}

export function routeBoxes(
  a: Box,
  b: Box,
  locked: { sourcePos?: Position; targetPos?: Position } = {},
): EdgeRoute {
  const auto = facingSides(a, b);
  const sourcePos = locked.sourcePos ?? auto.sourcePos;
  const targetPos = locked.targetPos ?? auto.targetPos;
  return routeAnchors(sidePoint(a, sourcePos), sidePoint(b, targetPos), sourcePos, targetPos);
}
