import { Panel, useReactFlow, useStore } from '@xyflow/react';
import { KIND_META, SWIMLANE_ACCENT } from '../constants';
import type { AppNode, ProcessNodeData, SwimlaneNodeData } from '../types';

const MAP_W = 188;
const MAP_H = 136;

export function OverviewMap() {
  const nodeLookup = useStore((s) => s.nodeLookup);
  const transform = useStore((s) => s.transform);
  const vpW = useStore((s) => s.width);
  const vpH = useStore((s) => s.height);
  const { setCenter } = useReactFlow();

  const boxes: Array<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    lane: boolean;
  }> = [];

  for (const node of nodeLookup.values()) {
    if (node.hidden) continue;
    const p = node.internals.positionAbsolute;
    const user = node.internals.userNode as AppNode;
    const w = node.measured.width || Number(user.style?.width) || 0;
    const h = node.measured.height || Number(user.style?.height) || 0;
    if (w < 4 || h < 4) continue;
    if (user.type === 'swimlane') {
      boxes.push({
        id: node.id,
        x: p.x,
        y: p.y,
        w,
        h,
        color: SWIMLANE_ACCENT[(user.data as SwimlaneNodeData).color],
        lane: true,
      });
    } else if (user.type === 'process') {
      boxes.push({
        id: node.id,
        x: p.x,
        y: p.y,
        w,
        h,
        color: KIND_META[(user.data as ProcessNodeData).kind].color,
        lane: false,
      });
    }
  }

  if (boxes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const box of boxes) {
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.w);
    maxY = Math.max(maxY, box.y + box.h);
  }

  const pad = 28;
  const vbW = Math.max(maxX - minX, 120) + pad * 2;
  const vbH = Math.max(maxY - minY, 90) + pad * 2;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const zoom = transform[2] || 1;
  const view = {
    x: -transform[0] / zoom,
    y: -transform[1] / zoom,
    w: vpW / zoom,
    h: vpH / zoom,
  };
  const stroke = Math.max(vbW, vbH) / 90;
  const lanes = boxes.filter((box) => box.lane);
  const steps = boxes.filter((box) => !box.lane);

  return (
    <Panel position="bottom-right" className="overview-map">
      <svg
        width={MAP_W}
        height={MAP_H}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Map overview"
        onClick={(event) => {
          const svg = event.currentTarget;
          const rect = svg.getBoundingClientRect();
          const x = vbX + ((event.clientX - rect.left) / rect.width) * vbW;
          const y = vbY + ((event.clientY - rect.top) / rect.height) * vbH;
          setCenter(x, y, { duration: 180 });
        }}
      >
        {lanes.map((box) => (
          <rect
            key={box.id}
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            fill={box.color}
            opacity={0.28}
            rx={6}
          />
        ))}
        {steps.map((box) => (
          <rect key={box.id} x={box.x} y={box.y} width={box.w} height={box.h} fill={box.color} rx={4} />
        ))}
        <rect
          x={view.x}
          y={view.y}
          width={view.w}
          height={view.h}
          fill="rgba(196,167,247,0.14)"
          stroke="#c4a7f7"
          strokeWidth={stroke}
          rx={2}
        />
      </svg>
    </Panel>
  );
}
