import { describe, expect, it } from 'vitest';
import { routeBoxes } from './edgeRoute';

describe('routeBoxes', () => {
  it('draws a vertical line when nodes share an x range', () => {
    const a = { x: 100, y: 40, w: 172, h: 56 };
    const b = { x: 100, y: 200, w: 180, h: 76 };
    const route = routeBoxes(a, b);
    expect(route.axisLocked).toBe(true);
    expect(route.sx).toBe(route.tx);
    expect(route.sy).toBe(96);
    expect(route.ty).toBe(200);
    expect(route.sx).toBe(100 + 172 / 2);
  });

  it('draws a horizontal line when nodes share a y range', () => {
    const a = { x: 40, y: 80, w: 160, h: 72 };
    const b = { x: 280, y: 90, w: 160, h: 72 };
    const route = routeBoxes(a, b);
    expect(route.axisLocked).toBe(true);
    expect(route.sy).toBe(route.ty);
    expect(route.sx).toBe(200);
    expect(route.tx).toBe(280);
  });

  it('uses facing sides when boxes do not overlap', () => {
    const a = { x: 0, y: 0, w: 80, h: 80 };
    const b = { x: 300, y: 300, w: 80, h: 80 };
    const route = routeBoxes(a, b);
    expect(route.axisLocked).toBe(false);
    expect(route.sy).toBe(80);
    expect(route.ty).toBe(300);
  });
});
