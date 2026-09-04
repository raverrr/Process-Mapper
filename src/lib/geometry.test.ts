import { describe, expect, it } from 'vitest';
import { SWIMLANE_WIDTH } from '../constants';
import type { SwimlaneNode } from '../types';
import { applyEqualSwimlaneWidth, maxSwimlaneWidth } from './geometry';

function lane(id: string, width: number): SwimlaneNode {
  return {
    id,
    type: 'swimlane',
    position: { x: 0, y: 0 },
    style: { width, height: 220 },
    data: { label: id, color: 'blue' },
  };
}

describe('equal swimlane widths', () => {
  it('reports the longest lane, or the default when there are none', () => {
    expect(maxSwimlaneWidth([])).toBe(SWIMLANE_WIDTH);
    expect(maxSwimlaneWidth([lane('a', 1200), lane('b', 1800)])).toBe(1800);
  });

  it('sets every lane to the given width and leaves other nodes alone', () => {
    const task = {
      id: 'n1',
      type: 'process' as const,
      position: { x: 10, y: 10 },
      style: { width: 180, height: 76 },
      data: { kind: 'task' as const, label: 'Task', notes: '', owners: '' },
    };
    const next = applyEqualSwimlaneWidth([lane('a', 1200), task, lane('b', 1800)], 1800);
    expect(next[0].style?.width).toBe(1800);
    expect(next[1]).toBe(task);
    expect(next[2].style?.width).toBe(1800);
  });
});
