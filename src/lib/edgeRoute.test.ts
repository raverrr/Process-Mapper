import { Position } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { ALIGN_TOLERANCE, routeBoxes } from './edgeRoute';

describe('routeBoxes', () => {
  it('snaps to a vertical line only when handle x values are nearly equal', () => {
    const a = { x: 100, y: 40, w: 160, h: 56 };
    const b = { x: 100, y: 200, w: 160, h: 76 };
    const route = routeBoxes(a, b);
    expect(route.axisLocked).toBe(true);
    expect(route.sx).toBe(route.tx);
    expect(route.sx).toBe(180);
    expect(route.sourcePos).toBe(Position.Bottom);
    expect(route.targetPos).toBe(Position.Top);
  });

  it('does not stay straight when centers differ by more than the tight tolerance', () => {
    const a = { x: 100, y: 40, w: 172, h: 56 };
    const b = { x: 100, y: 200, w: 180, h: 76 };
    const route = routeBoxes(a, b);
    expect(Math.abs(a.w / 2 - b.w / 2)).toBeGreaterThan(ALIGN_TOLERANCE);
    expect(route.axisLocked).toBe(false);
    expect(route.sx).toBe(100 + 172 / 2);
    expect(route.tx).toBe(100 + 180 / 2);
  });

  it('still snaps when the offset is within the tight tolerance', () => {
    const a = { x: 100, y: 40, w: 160, h: 56 };
    const b = { x: 102, y: 200, w: 160, h: 76 };
    const route = routeBoxes(a, b);
    expect(route.axisLocked).toBe(true);
    expect(route.sx).toBe(route.tx);
  });

  it('honours a locked source handle instead of auto-facing', () => {
    const a = { x: 0, y: 0, w: 80, h: 80 };
    const b = { x: 200, y: 0, w: 80, h: 80 };
    const route = routeBoxes(a, b, { sourcePos: Position.Bottom });
    expect(route.sourcePos).toBe(Position.Bottom);
    expect(route.sx).toBe(40);
    expect(route.sy).toBe(80);
  });
});
