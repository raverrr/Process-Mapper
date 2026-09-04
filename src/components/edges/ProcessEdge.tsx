import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react';
import { handleIdToPosition, routeBoxes } from '../../lib/edgeRoute';
import type { AppEdge, ProcessNodeData } from '../../types';

function boxOf(node: NonNullable<ReturnType<typeof useInternalNode>>) {
  const p = node.internals.positionAbsolute;
  const w = node.measured.width || Number(node.internals.userNode.style?.width) || 160;
  const h = node.measured.height || Number(node.internals.userNode.style?.height) || 80;
  return { x: p.x, y: p.y, w, h };
}

function anchorsLocked(node: NonNullable<ReturnType<typeof useInternalNode>>): boolean {
  const user = node.internals.userNode;
  return user.type === 'process' && Boolean((user.data as ProcessNodeData).lockAnchors);
}

export function ProcessEdge({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  markerEnd,
  style,
  label,
  selected,
  data,
}: EdgeProps<AppEdge>) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;

  const route = routeBoxes(boxOf(sourceNode), boxOf(targetNode), {
    sourcePos: anchorsLocked(sourceNode) ? handleIdToPosition(sourceHandleId) : undefined,
    targetPos: anchorsLocked(targetNode) ? handleIdToPosition(targetHandleId) : undefined,
  });
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

  const text = data?.label || (typeof label === 'string' ? label : undefined);

  return (
    <BaseEdge
      id={id}
      path={path}
      labelX={labelX}
      labelY={labelY}
      label={text}
      labelShowBg
      labelStyle={{
        fill: selected ? '#e6d6ff' : '#ececf1',
        fontSize: 11,
        fontWeight: 500,
      }}
      labelBgStyle={{
        fill: '#1b1b24',
        stroke: selected ? '#c4a7f7' : '#2a2a36',
      }}
      labelBgPadding={[5, 8]}
      labelBgBorderRadius={10}
      markerEnd={markerEnd}
      style={style}
      interactionWidth={20}
    />
  );
}
