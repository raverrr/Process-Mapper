import { describe, expect, it } from 'vitest';
import { DEFAULT_EDGE_STROKE, EDGE_COLOR_HEX } from '../constants';
import { edgeVisuals, resolveEdgeColor } from './edgeStyle';

describe('edge color', () => {
  it('uses the grey stroke when no color is set', () => {
    expect(resolveEdgeColor()).toBe(DEFAULT_EDGE_STROKE);
    expect(edgeVisuals({}).style.stroke).toBe(DEFAULT_EDGE_STROKE);
  });

  it('paints the line and arrow the same colour', () => {
    const look = edgeVisuals({ color: 'green', dashed: true });
    expect(look.style.stroke).toBe(EDGE_COLOR_HEX.green);
    expect(look.markerEnd.color).toBe(EDGE_COLOR_HEX.green);
    expect(look.style.strokeDasharray).toBe('7 5');
  });
});
