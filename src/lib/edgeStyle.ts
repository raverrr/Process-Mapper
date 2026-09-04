import { MarkerType } from '@xyflow/react';
import { DEFAULT_EDGE_STROKE, EDGE_COLOR_HEX } from '../constants';
import type { EdgeColor, ProcessEdgeData } from '../types';

export function resolveEdgeColor(color?: EdgeColor | null): string {
  if (color && color in EDGE_COLOR_HEX) return EDGE_COLOR_HEX[color];
  return DEFAULT_EDGE_STROKE;
}

export function edgeVisuals(data: Pick<ProcessEdgeData, 'color' | 'dashed'> = {}) {
  const color = resolveEdgeColor(data.color);
  return {
    color,
    style: {
      stroke: color,
      ...(data.dashed ? { strokeDasharray: '7 5' } : {}),
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color,
    },
  };
}
