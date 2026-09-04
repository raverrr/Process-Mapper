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

/** Stay perfectly straight only when handles are this close on the shared axis. */
export const ALIGN_TOLERANCE = 3;

export function handleIdToPosition(id?: string | null): Position | undefined {
  if (id === 't') return Position.Top;
  if (id === 'r') return Position.Right;
  if (id === 'b') return Position.Bottom;
  if (id === 'l') return Position.Left;
  return undefined;
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

export function routeBoxes(
  a: Box,
  b: Box,
  locked: { sourcePos?: Position; targetPos?: Position } = {},
): EdgeRoute {
  const auto = facingSides(a, b);
  const sourcePos = locked.sourcePos ?? auto.sourcePos;
  const targetPos = locked.targetPos ?? auto.targetPos;
  const src = sidePoint(a, sourcePos);
  const tgt = sidePoint(b, targetPos);
  const vertical = sourcePos === Position.Top || sourcePos === Position.Bottom;

  if (vertical && Math.abs(src.x - tgt.x) <= ALIGN_TOLERANCE) {
    const x = (src.x + tgt.x) / 2;
    return {
      sx: x,
      sy: src.y,
      tx: x,
      ty: tgt.y,
      sourcePos,
      targetPos,
      axisLocked: true,
    };
  }
  if (!vertical && Math.abs(src.y - tgt.y) <= ALIGN_TOLERANCE) {
    const y = (src.y + tgt.y) / 2;
    return {
      sx: src.x,
      sy: y,
      tx: tgt.x,
      ty: y,
      sourcePos,
      targetPos,
      axisLocked: true,
    };
  }

  return {
    sx: src.x,
    sy: src.y,
    tx: tgt.x,
    ty: tgt.y,
    sourcePos,
    targetPos,
    axisLocked: false,
  };
}
