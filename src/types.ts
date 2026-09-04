import type { Edge, Node, Viewport } from '@xyflow/react';

export const PROCESS_KINDS = [
  'start-end',
  'task',
  'decision',
  'event',
  'input-output',
  'document',
  'database',
  'preparation',
] as const;

export type ProcessKind = (typeof PROCESS_KINDS)[number];

export const SWIMLANE_COLORS = ['gray', 'blue', 'green', 'yellow', 'purple', 'red'] as const;
export type SwimlaneColor = (typeof SWIMLANE_COLORS)[number];

export const PATH_KINDS = ['smoothstep', 'bezier', 'straight', 'step'] as const;
export type PathKind = (typeof PATH_KINDS)[number];

export type ProcessNodeData = {
  kind: ProcessKind;
  label: string;
  notes: string;
  owners: string;
  leadTimeDays?: number;
  processTimeMinutes?: number;
  percentCA?: number;
};

export type SwimlaneNodeData = {
  label: string;
  color: SwimlaneColor;
};

export type ProcessEdgeData = {
  label?: string;
  path: PathKind;
  dashed?: boolean;
};

export type ProcessNode = Node<ProcessNodeData, 'process'>;
export type SwimlaneNode = Node<SwimlaneNodeData, 'swimlane'>;
export type AppNode = ProcessNode | SwimlaneNode;
export type AppEdge = Edge<ProcessEdgeData>;

export type MapDocument = {
  version: 2;
  title: string;
  hoursPerDay: number;
  nodes: AppNode[];
  edges: AppEdge[];
  viewport?: Viewport;
};

export type V1Node = {
  id: string;
  type: string;
  name: string;
  left: number;
  top: number;
  height?: number;
  notes?: string;
  owners?: string;
};

export type V1Connector = {
  startNodeId: string;
  endNodeId: string;
  pathType?: string;
  label?: string;
};

export type V1Swimlane = {
  id: string;
  label: string;
  color?: string;
  top: number;
  height: number;
};

export type V1Vsm = {
  id?: string;
  left: number;
  top: number;
  width?: number;
  height?: number;
  leadTime?: number;
  processTime?: number;
  percentCA?: number;
};

export type V1Map = {
  title?: string;
  nodes?: V1Node[];
  connectors?: V1Connector[];
  swimlanes?: V1Swimlane[];
  vsmContainers?: V1Vsm[];
};
