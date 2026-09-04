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

const MIN_OVERLAP = 12;

export function routeBoxes(a: Box, b: Box): EdgeRoute {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  const vertical = Math.abs(bcy - acy) >= Math.abs(bcx - acx);

  if (vertical) {
    const x = overlapX >= MIN_OVERLAP ? Math.max(a.x, b.x) + overlapX / 2 : acx;
    const locked = overlapX >= MIN_OVERLAP;
    const tx = locked ? x : bcx;
    if (acy <= bcy) {
      return { sx: x, sy: a.y + a.h, tx, ty: b.y, sourcePos: Position.Bottom, targetPos: Position.Top, axisLocked: locked };
    }
    return { sx: x, sy: a.y, tx, ty: b.y + b.h, sourcePos: Position.Top, targetPos: Position.Bottom, axisLocked: locked };
  }

  const y = overlapY >= MIN_OVERLAP ? Math.max(a.y, b.y) + overlapY / 2 : acy;
  const locked = overlapY >= MIN_OVERLAP;
  const ty = locked ? y : bcy;
  if (acx <= bcx) {
    return { sx: a.x + a.w, sy: y, tx: b.x, ty, sourcePos: Position.Right, targetPos: Position.Left, axisLocked: locked };
  }
  return { sx: a.x, sy: y, tx: b.x + b.w, ty, sourcePos: Position.Left, targetPos: Position.Right, axisLocked: locked };
}
