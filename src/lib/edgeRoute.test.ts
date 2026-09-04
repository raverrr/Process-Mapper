import { Position } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import {
  ALIGN_TOLERANCE,
  handleCenter,
  pickHandle,
  routeBoxes,
} from './edgeRoute';

describe('routeBoxes', () => {
  it('keeps a vertical stack on the handle centers when they already share an x', () => {
    const a = { x: 100, y: 40, w: 160, h: 56 };
    const b = { x: 100, y: 200, w: 160, h: 76 };
    const route = routeBoxes(a, b);
    expect(route.axisLocked).toBe(true);
    expect(route.sx).toBe(180);
    expect(route.tx).toBe(180);
    expect(route.sourcePos).toBe(Position.Bottom);
    expect(route.targetPos).toBe(Position.Top);
  });

  it('does not slide endpoints toward a midpoint when widths differ', () => {
    const a = { x: 100, y: 40, w: 172, h: 56 };
    const b = { x: 100, y: 200, w: 180, h: 76 };
    const route = routeBoxes(a, b);
    expect(Math.abs(a.w / 2 - b.w / 2)).toBeGreaterThan(ALIGN_TOLERANCE);
    expect(route.axisLocked).toBe(false);
    expect(route.sx).toBe(100 + 172 / 2);
    expect(route.tx).toBe(100 + 180 / 2);
  });

  it('leaves a 2px misalignment on the real handles instead of forcing a straight line', () => {
    const a = { x: 100, y: 40, w: 160, h: 56 };
    const b = { x: 102, y: 200, w: 160, h: 76 };
    const route = routeBoxes(a, b);
    expect(route.axisLocked).toBe(false);
    expect(route.sx).toBe(180);
    expect(route.tx).toBe(182);
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

describe('handle anchors', () => {
  it('uses the handle box center so the stroke sits on the visible anchor', () => {
    const point = handleCenter({ x: 10, y: 20 }, {
      id: 'b',
      x: 68,
      y: 140,
      width: 8,
      height: 8,
      position: Position.Bottom,
    });
    expect(point).toEqual({ x: 82, y: 164 });
  });

  it('picks a handle by id, then by side', () => {
    const handles = [
      { id: 't', x: 0, y: 0, width: 8, height: 8, position: Position.Top },
      { id: 'b', x: 0, y: 40, width: 8, height: 8, position: Position.Bottom },
    ];
    expect(pickHandle(handles, Position.Bottom, 't')?.id).toBe('t');
    expect(pickHandle(handles, Position.Bottom)?.id).toBe('b');
  });
});
