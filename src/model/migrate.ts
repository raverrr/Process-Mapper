import { KIND_META, SWIMLANE_WIDTH } from '../constants';
import { createEdge, createProcessNode, createSwimlaneNode } from '../lib/factory';
import { sortParentsFirst } from '../lib/geometry';
import type {
  AppEdge,
  AppNode,
  MapDocument,
  PathKind,
  ProcessKind,
  ProcessNode,
  SwimlaneColor,
  SwimlaneNode,
  V1Map,
} from '../types';
import { PROCESS_KINDS, SWIMLANE_COLORS } from '../types';

const KIND_SET = new Set<string>(PROCESS_KINDS);
const COLOR_SET = new Set<string>(SWIMLANE_COLORS);

function asKind(value: string): ProcessKind {
  return KIND_SET.has(value) ? (value as ProcessKind) : 'task';
}

function asColor(value: string | undefined): SwimlaneColor {
  if (value && COLOR_SET.has(value)) return value as SwimlaneColor;
  return 'gray';
}

function asPath(pathType: string | undefined): { path: PathKind; dashed: boolean } {
  if (pathType === 'dash') return { path: 'smoothstep', dashed: true };
  if (pathType === 'straight') return { path: 'straight', dashed: false };
  if (pathType === 'step') return { path: 'step', dashed: false };
  if (pathType === 'smoothstep') return { path: 'smoothstep', dashed: false };
  return { path: 'bezier', dashed: false };
}

function center(node: { left: number; top: number; height?: number }): { x: number; y: number } {
  return { x: node.left + 50, y: node.top + (node.height ?? 50) / 2 };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function isV1Map(data: unknown): data is V1Map {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return record.version == null && (Array.isArray(record.nodes) || Array.isArray(record.connectors));
}

export function isV2Map(data: unknown): data is MapDocument {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return record.version === 2 && Array.isArray(record.nodes);
}

export function migrateV1(raw: V1Map): MapDocument {
  const v1Nodes = raw.nodes ?? [];
  const v1Lanes = raw.swimlanes ?? [];
  const v1Connectors = raw.connectors ?? [];
  const v1Vsm = raw.vsmContainers ?? [];

  const lanes: SwimlaneNode[] = v1Lanes.map((lane) => {
    const node = createSwimlaneNode({ x: 0, y: lane.top }, lane.label || 'Lane', asColor(lane.color));
    node.id = lane.id;
    node.style = { width: SWIMLANE_WIDTH, height: Math.max(120, lane.height || 100) };
    return node;
  });

  const processes: ProcessNode[] = v1Nodes.map((item) => {
    const kind = asKind(item.type);
    const node = createProcessNode(kind, { x: item.left, y: item.top }, {
      label: item.name || KIND_META[kind].defaultName,
      notes: item.notes ?? '',
      owners: item.owners ?? '',
    });
    node.id = item.id;
    return node;
  });

  const withParents: AppNode[] = processes.map((node) => {
    const v1 = v1Nodes.find((item) => item.id === node.id);
    if (!v1) return node;
    const cy = v1.top + (v1.height ?? 50) / 2;
    const lane = v1Lanes.find((item) => cy >= item.top && cy <= item.top + (item.height || 100));
    if (!lane) return node;
    return {
      ...node,
      parentId: lane.id,
      position: {
        x: Math.max(56, v1.left),
        y: Math.max(12, v1.top - lane.top),
      },
    };
  });

  for (const box of v1Vsm) {
    const boxCenter = { x: box.left + (box.width ?? 300) / 2, y: box.top + (box.height ?? 200) / 2 };
    let nearest: ProcessNode | undefined;
    let best = 280;
    for (const node of withParents) {
      if (node.type !== 'process') continue;
      const v1 = v1Nodes.find((item) => item.id === node.id);
      if (!v1) continue;
      const d = distance(center(v1), boxCenter);
      if (d < best) {
        best = d;
        nearest = node;
      }
    }
    if (nearest) {
      nearest.data = {
        ...nearest.data,
        leadTimeDays: box.leadTime || undefined,
        processTimeMinutes: box.processTime || undefined,
        percentCA: box.percentCA,
      };
    } else {
      withParents.push(
        createProcessNode('task', { x: box.left, y: box.top }, {
          label: 'VSM step',
          leadTimeDays: box.leadTime || undefined,
          processTimeMinutes: box.processTime || undefined,
          percentCA: box.percentCA,
        }),
      );
    }
  }

  const processIds = new Set(withParents.map((n) => n.id));
  const edges: AppEdge[] = [];
  for (const conn of v1Connectors) {
    if (!processIds.has(conn.startNodeId) || !processIds.has(conn.endNodeId)) continue;
    if (conn.startNodeId === conn.endNodeId) continue;
    const { path, dashed } = asPath(conn.pathType);
    edges.push(
      createEdge(conn.startNodeId, conn.endNodeId, {
        label: conn.label,
        path,
        dashed,
      }),
    );
  }

  return {
    version: 2,
    title: raw.title || 'Untitled Map',
    hoursPerDay: 8,
    nodes: sortParentsFirst([...lanes, ...withParents]),
    edges,
  };
}
