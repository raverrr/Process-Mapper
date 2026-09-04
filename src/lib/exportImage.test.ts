import { describe, expect, it } from 'vitest';
import type { ProcessNode, SwimlaneNode } from '../types';
import { collectNodeDetails } from './exportImage';

function task(id: string, extras: Partial<ProcessNode['data']> = {}): ProcessNode {
  return {
    id,
    type: 'process',
    position: { x: 0, y: 0 },
    data: {
      kind: 'task',
      label: extras.label ?? id,
      notes: extras.notes ?? '',
      owners: extras.owners ?? '',
      leadTimeDays: extras.leadTimeDays,
      processTimeMinutes: extras.processTimeMinutes,
      percentCA: extras.percentCA,
    },
  };
}

describe('collectNodeDetails', () => {
  it('skips nodes that only have a label', () => {
    expect(collectNodeDetails([task('a')])).toEqual([]);
  });

  it('includes notes, owners, and VSM, and ignores swimlanes', () => {
    const lane: SwimlaneNode = {
      id: 'lane',
      type: 'swimlane',
      position: { x: 0, y: 0 },
      data: { label: 'Ops', color: 'blue' },
    };
    const details = collectNodeDetails([
      task('blank'),
      task('noted', { label: 'Review', notes: '  Check the PO  ' }),
      task('owned', { label: 'Pay', owners: 'Finance' }),
      task('vsm', { label: 'Pack', leadTimeDays: 2, processTimeMinutes: 30, percentCA: 95 }),
      lane,
    ]);
    expect(details.map((item) => item.label)).toEqual(['Review', 'Pay', 'Pack']);
    expect(details[0].notes).toBe('Check the PO');
    expect(details[1].owners).toBe('Finance');
    expect(details[2].vsm).toBe('LT 2d · PT 30m · 95% C&A');
  });

  it('orders by position on the map', () => {
    const top = task('top', { notes: 'a', label: 'Top' });
    top.position = { x: 80, y: 10 };
    const bottom = task('bottom', { notes: 'b', label: 'Bottom' });
    bottom.position = { x: 20, y: 200 };
    expect(collectNodeDetails([bottom, top]).map((item) => item.label)).toEqual(['Top', 'Bottom']);
  });
});
