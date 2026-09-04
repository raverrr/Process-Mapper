import { describe, expect, it } from 'vitest';
import { createProcessNode } from '../lib/factory';
import { computeVsm, formatDuration } from './vsm';

describe('computeVsm', () => {
  it('computes rolled C&A as a product and PCE with working hours', () => {
    const nodes = [
      createProcessNode('task', { x: 0, y: 0 }, {
        leadTimeDays: 1,
        processTimeMinutes: 60,
        percentCA: 90,
      }),
      createProcessNode('task', { x: 200, y: 0 }, {
        leadTimeDays: 1,
        processTimeMinutes: 120,
        percentCA: 80,
      }),
    ];

    const stats = computeVsm(nodes, 8);
    expect(stats.rolledCA).toBeCloseTo(72, 5);
    expect(stats.sumLeadMinutes).toBe(2 * 8 * 60);
    expect(stats.sumProcessMinutes).toBe(180);
    expect(stats.pce).toBeCloseTo((180 / 960) * 100, 5);
  });

  it('ignores nodes without VSM fields', () => {
    const nodes = [
      createProcessNode('start-end', { x: 0, y: 0 }),
      createProcessNode('task', { x: 10, y: 0 }, { percentCA: 50 }),
    ];
    const stats = computeVsm(nodes, 8);
    expect(stats.steps).toHaveLength(1);
    expect(stats.pce).toBeNull();
    expect(stats.rolledCA).toBeCloseTo(50, 5);
  });

  it('clamps wait time at zero when process time exceeds lead time', () => {
    const nodes = [
      createProcessNode('task', { x: 0, y: 0 }, {
        leadTimeDays: 0.01,
        processTimeMinutes: 500,
      }),
    ];
    const stats = computeVsm(nodes, 8);
    expect(stats.steps[0].waitMinutes).toBe(0);
  });
});

describe('formatDuration', () => {
  it('picks days, hours, or minutes', () => {
    expect(formatDuration(8 * 60, 8)).toBe('1d');
    expect(formatDuration(90, 8)).toBe('1.5h');
    expect(formatDuration(12, 8)).toBe('12m');
    expect(formatDuration(0, 8)).toBe('0');
  });
});
