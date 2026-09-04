import { describe, expect, it } from 'vitest';
import type { ProcessNode } from '../types';
import { snapToHelpers } from './helpers';

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
    const { position, lines } = snapToHelpers('b', { x: 80, y: 200 }, [wide, narrow], 8);
    expect(lines.vertical).toBeDefined();
    const wideCenter = 80 + 180 / 2;
    expect(position.x + 172 / 2).toBeCloseTo(wideCenter, 5);
  });
});
