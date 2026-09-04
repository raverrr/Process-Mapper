import { describe, expect, it } from 'vitest';
import type { ProcessNode } from '../types';
import { snapCenterToGrid, snapPosition, snapToHelpers } from './helpers';

function task(id: string, x: number, y: number, w = 180, h = 76): ProcessNode {
  return {
    id,
    type: 'process',
    position: { x, y },
    style: { width: w, height: h },
    data: { kind: 'task', label: id, notes: '', owners: '' },
  };
}

describe('snapToHelpers', () => {
  it('prefers center alignment so vertical stacks share a midpoint', () => {
    const wide = task('a', 80, 40, 180, 76);
    const narrow = task('b', 80, 200, 172, 56);
    const { position, lines } = snapToHelpers('b', { x: 80, y: 200 }, [wide, narrow], 12);
    expect(lines.vertical).toBeDefined();
    const wideCenter = 80 + 180 / 2;
    expect(position.x + 172 / 2).toBeCloseTo(wideCenter, 5);
  });
});

describe('snapCenterToGrid', () => {
  it('puts handle centers on the grid so mixed-width nodes can line up', () => {
    const decision = snapCenterToGrid({ x: 100, y: 40 }, { w: 144, h: 144 });
    const taskNode = snapCenterToGrid({ x: 84, y: 220 }, { w: 180, h: 76 });
    expect((decision.x + 144 / 2) % 8).toBe(0);
    expect((taskNode.x + 180 / 2) % 8).toBe(0);
    expect(decision.x + 144 / 2).toBe(taskNode.x + 180 / 2);
  });
});

describe('snapPosition', () => {
  it('keeps a near-center stack on the other node instead of the top-left grid', () => {
    const wide = task('a', 80, 40, 180, 76);
    const narrow = task('b', 86, 200, 144, 144);
    const { position, lines } = snapPosition('b', { x: 86, y: 200 }, [wide, narrow]);
    expect(lines.vertical).toBeDefined();
    expect(position.x + 144 / 2).toBeCloseTo(80 + 180 / 2, 5);
  });

  it('grids the free axis while a helper holds the aligned one', () => {
    const wide = task('a', 80, 40, 180, 76);
    const narrow = task('b', 86, 203, 144, 144);
    const { position, lines } = snapPosition('b', { x: 86, y: 203 }, [wide, narrow]);
    expect(lines.vertical).toBeDefined();
    expect(lines.horizontal).toBeUndefined();
    expect(position.x + 144 / 2).toBeCloseTo(80 + 180 / 2, 5);
    expect((position.y + 144 / 2) % 8).toBe(0);
  });
});
