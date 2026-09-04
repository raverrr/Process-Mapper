import { NodeResizer, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { SWIMLANE_ACCENT, SWIMLANE_FILL } from '../../constants';
import type { SwimlaneNode as SwimlaneNodeType } from '../../types';

function SwimlaneNodeComponent({ data, selected }: NodeProps<SwimlaneNodeType>) {
  const fill = SWIMLANE_FILL[data.color];
  const accent = SWIMLANE_ACCENT[data.color];

  return (
    <div className={`swimlane-node${selected ? ' is-selected' : ''}`}>
      <NodeResizer
        isVisible={selected}
        minWidth={480}
        minHeight={140}
        lineStyle={{ borderColor: 'transparent' }}
        handleStyle={{ width: 22, height: 22, background: 'transparent', border: 'none' }}
      />
      <div
        className="swimlane-body"
        style={{
          background: fill,
          borderColor: selected ? '#c4a7f7' : 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="swimlane-drag" style={{ background: accent }}>
          <span>{data.label}</span>
        </div>
      </div>
    </div>
  );
}

export const SwimlaneNode = memo(SwimlaneNodeComponent);
