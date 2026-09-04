import { DEFAULT_HOURS_PER_DAY, STORAGE_KEY } from '../constants';
import { initialNodes } from '../lib/factory';
import { sortParentsFirst } from '../lib/geometry';
import type { AppEdge, AppNode, MapDocument } from '../types';
import { isV1Map, isV2Map, migrateV1 } from './migrate';

export function emptyDocument(): MapDocument {
  return {
    version: 2,
    title: 'Untitled Map',
    hoursPerDay: DEFAULT_HOURS_PER_DAY,
    nodes: initialNodes(),
    edges: [],
  };
}

export function toDocument(
  title: string,
  hoursPerDay: number,
  nodes: AppNode[],
  edges: AppEdge[],
  viewport?: MapDocument['viewport'],
): MapDocument {
  return {
    version: 2,
    title: title.trim() || 'Untitled Map',
    hoursPerDay: hoursPerDay > 0 ? hoursPerDay : DEFAULT_HOURS_PER_DAY,
    nodes: sortParentsFirst(nodes).map((node) => ({
      ...node,
      selected: false,
      dragging: false,
    })),
    edges: edges.map((edge) => ({ ...edge, selected: false })),
    viewport,
  };
}

export function parseMap(data: unknown): { doc: MapDocument; migratedFromV1: boolean } {
  if (isV2Map(data)) {
    return {
      doc: {
        version: 2,
        title: data.title || 'Untitled Map',
        hoursPerDay: data.hoursPerDay > 0 ? data.hoursPerDay : DEFAULT_HOURS_PER_DAY,
        nodes: Array.isArray(data.nodes) ? (data.nodes as AppNode[]) : [],
        edges: Array.isArray(data.edges) ? (data.edges as AppEdge[]) : [],
        viewport: data.viewport,
      },
      migratedFromV1: false,
    };
  }
  if (isV1Map(data)) {
    return { doc: migrateV1(data), migratedFromV1: true };
  }
  throw new Error('Not a Process Mapper JSON file.');
}

export function loadAutosave(): MapDocument | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseMap(JSON.parse(raw)).doc;
  } catch {
    return null;
  }
}

export function saveAutosave(doc: MapDocument): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  } catch {
    // quota / private mode — ignore
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function fileNameFor(title: string): string {
  const safe = (title || 'process-map').replace(/[^\w\-]+/g, '_').replace(/_+/g, '_');
  return `${safe || 'process-map'}.json`;
}
