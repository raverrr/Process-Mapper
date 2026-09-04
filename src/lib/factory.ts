import { MarkerType } from '@xyflow/react';
import type { XYPosition } from '@xyflow/react';
import {
  KIND_META,
  KIND_SIZES,
  SWIMLANE_HEIGHT,
  SWIMLANE_WIDTH,
} from '../constants';
import type {
  AppEdge,
  AppNode,
  PathKind,
  ProcessKind,
  ProcessNode,
  SwimlaneColor,
  SwimlaneNode,
} from '../types';
import { nextId } from './ids';

export function createProcessNode(
  kind: ProcessKind,
  position: XYPosition,
  extras: Partial<ProcessNode['data']> = {},
): ProcessNode {
  const size = KIND_SIZES[kind];
  return {
    id: nextId('n'),
    type: 'process',
    position,
    zIndex: 10,
    style: { width: size.w, height: size.h },
    data: {
      kind,
      label: extras.label ?? KIND_META[kind].defaultName,
      notes: extras.notes ?? '',
      owners: extras.owners ?? '',
      lockAnchors: extras.lockAnchors,
      leadTimeDays: extras.leadTimeDays,
      processTimeMinutes: extras.processTimeMinutes,
      percentCA: extras.percentCA,
    },
  };
}

export function createSwimlaneNode(
  position: XYPosition,
  label = 'Lane',
  color: SwimlaneColor = 'blue',
  width = SWIMLANE_WIDTH,
): SwimlaneNode {
  return {
    id: nextId('lane'),
    type: 'swimlane',
    position,
    dragHandle: '.swimlane-drag',
    zIndex: 0,
    style: { width, height: SWIMLANE_HEIGHT },
    data: { label, color },
  };
}

export function createEdge(
  source: string,
  target: string,
  options: {
    sourceHandle?: string | null;
    targetHandle?: string | null;
    label?: string;
    path?: PathKind;
    dashed?: boolean;
  } = {},
): AppEdge {
  const path = options.path ?? 'smoothstep';
  return {
    id: nextId('e'),
    source,
    target,
    sourceHandle: options.sourceHandle ?? undefined,
    targetHandle: options.targetHandle ?? undefined,
    type: 'process',
    label: options.label || undefined,
    animated: Boolean(options.dashed),
    style: options.dashed ? { strokeDasharray: '7 5' } : undefined,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: '#c8c8d4',
    },
    data: {
      path,
      label: options.label || undefined,
      dashed: options.dashed,
    },
  };
}

export function initialNodes(): AppNode[] {
  return [createProcessNode('start-end', { x: 120, y: 140 }, { label: 'Process Start' })];
}
