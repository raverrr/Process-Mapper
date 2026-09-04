import { describe, expect, it } from 'vitest';
import { parseMap } from './document';
import { migrateV1 } from './migrate';

const v1 = {
  title: 'Invoice flow',
  nodes: [
    {
      id: 'container0',
      type: 'start-end',
      name: 'Process Start',
      left: 100,
      top: 100,
      height: 50,
      notes: 'kickoff',
      owners: 'Ops',
    },
    {
      id: 'container1',
      type: 'task',
      name: 'Review',
      left: 100,
      top: 250,
      height: 50,
      notes: '',
      owners: '',
    },
    {
      id: 'container2',
      type: 'decision',
      name: 'OK?',
      left: 400,
      top: 120,
      height: 50,
    },
  ],
  connectors: [
    { startNodeId: 'container0', endNodeId: 'container1', pathType: 'straight', label: '' },
    { startNodeId: 'container1', endNodeId: 'container2', pathType: 'dash', label: 'Yes' },
  ],
  swimlanes: [
    { id: 'swimlane0', label: 'Finance', color: 'blue', top: 80, height: 200 },
  ],
  vsmContainers: [
    { id: 'vsm0', left: 80, top: 220, width: 300, height: 200, leadTime: 2, processTime: 30, percentCA: 95 },
  ],
};

describe('migrateV1', () => {
  it('keeps ids, maps dashed connectors, and attaches VSM to the nearest step', () => {
    const doc = migrateV1(v1);
    expect(doc.version).toBe(2);
    expect(doc.title).toBe('Invoice flow');
    expect(doc.nodes.some((n) => n.id === 'container0' && n.type === 'process')).toBe(true);
    expect(doc.nodes.some((n) => n.id === 'swimlane0' && n.type === 'swimlane')).toBe(true);
    expect(doc.edges).toHaveLength(2);

    const dashed = doc.edges.find((e) => e.data?.dashed);
    expect(dashed?.data?.path).toBe('smoothstep');
    expect(dashed?.label).toBe('Yes');

    const review = doc.nodes.find((n) => n.id === 'container1');
    expect(review?.type).toBe('process');
    if (review?.type === 'process') {
      expect(review.data.leadTimeDays).toBe(2);
      expect(review.data.processTimeMinutes).toBe(30);
      expect(review.data.percentCA).toBe(95);
      expect(review.parentId).toBe('swimlane0');
    }
  });

  it('survives missing optional arrays', () => {
    const doc = migrateV1({ title: 'Bare' });
    expect(doc.nodes).toEqual([]);
    expect(doc.edges).toEqual([]);
  });
});

describe('parseMap', () => {
  it('detects v1 vs v2', () => {
    const v1result = parseMap(v1);
    expect(v1result.migratedFromV1).toBe(true);
    expect(v1result.doc.version).toBe(2);

    const roundTrip = parseMap(v1result.doc);
    expect(roundTrip.migratedFromV1).toBe(false);
    expect(roundTrip.doc.title).toBe('Invoice flow');
  });

  it('rejects junk', () => {
    expect(() => parseMap({ hello: true })).toThrow(/Not a Process Mapper/);
  });

  it('updates stored event node size while keeping the circle centered', () => {
    const result = parseMap({
      version: 2,
      title: 'Events',
      hoursPerDay: 8,
      nodes: [
        {
          id: 'n1',
          type: 'process',
          position: { x: 100, y: 80 },
          style: { width: 80, height: 80 },
          data: { kind: 'event', label: 'Mail', notes: '', owners: '' },
        },
      ],
      edges: [],
    });
    const node = result.doc.nodes[0];
    expect(node.style?.width).toBe(96);
    expect(node.style?.height).toBe(96);
    expect(node.position).toEqual({ x: 92, y: 72 });
  });
});
