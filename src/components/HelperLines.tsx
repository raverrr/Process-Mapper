import { useStore, type ReactFlowState } from '@xyflow/react';
import type { HelperLines as Lines } from '../lib/helpers';

const selectViewport = (s: ReactFlowState) => ({
  width: s.width,
  height: s.height,
  transform: s.transform,
});

export function HelperLinesOverlay({ lines }: { lines: Lines }) {
  const { width, height, transform } = useStore(selectViewport);

  if (lines.horizontal == null && lines.vertical == null) return null;

  const [tx, ty, zoom] = transform;

  return (
    <svg className="helper-lines" width={width} height={height}>
      {lines.vertical != null ? (
        <line
          x1={lines.vertical * zoom + tx}
          y1={0}
          x2={lines.vertical * zoom + tx}
          y2={height}
          stroke="#c4a7f7"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      ) : null}
      {lines.horizontal != null ? (
        <line
          x1={0}
          y1={lines.horizontal * zoom + ty}
          x2={width}
          y2={lines.horizontal * zoom + ty}
          stroke="#c4a7f7"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      ) : null}
    </svg>
  );
}
