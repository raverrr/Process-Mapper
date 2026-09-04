import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react';
import { routeBoxes } from '../../lib/edgeRoute';
import type { AppEdge } from '../../types';

function boxOf(node: NonNullable<ReturnType<typeof useInternalNode>>) {
  const p = node.internals.positionAbsolute;
  const w = node.measured.width || Number(node.internals.userNode.style?.width) || 160;
  const h = node.measured.height || Number(node.internals.userNode.style?.height) || 80;
  return { x: p.x, y: p.y, w, h };
}

export function ProcessEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  label,
  selected,
  data,
}: EdgeProps<AppEdge>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;

  const route = routeBoxes(boxOf(sourceNode), boxOf(targetNode));
  const pathKind = data?.path ?? 'smoothstep';
  const params = {
    sourceX: route.sx,
    sourceY: route.sy,
    targetX: route.tx,
    targetY: route.ty,
    sourcePosition: route.sourcePos,
    targetPosition: route.targetPos,
  };

  const [path, labelX, labelY] =
    pathKind === 'straight' || route.axisLocked
      ? getStraightPath(params)
      : pathKind === 'step'
        ? getSmoothStepPath({ ...params, borderRadius: 0 })
        : pathKind === 'bezier'
          ? getBezierPath(params)
          : getSmoothStepPath(params);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={20}
        className={selected ? 'selected' : undefined}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan edge-label"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
