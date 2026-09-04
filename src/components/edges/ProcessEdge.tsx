import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
  type Position,
} from '@xyflow/react';
import {
  facingSides,
  handleCenter,
  handleIdToPosition,
  pickHandle,
  positionToHandleId,
  routeAnchors,
  sidePoint,
} from '../../lib/edgeRoute';
import type { AppEdge, ProcessNodeData } from '../../types';

function boxOf(node: InternalNode) {
  const p = node.internals.positionAbsolute;
  const w = node.measured.width || Number(node.internals.userNode.style?.width) || 160;
  const h = node.measured.height || Number(node.internals.userNode.style?.height) || 80;
  return { x: p.x, y: p.y, w, h };
}

function anchorsLocked(node: InternalNode): boolean {
  const user = node.internals.userNode;
  return user.type === 'process' && Boolean((user.data as ProcessNodeData).lockAnchors);
}

function anchorOf(node: InternalNode, pos: Position, handleId?: string | null) {
  const handle = pickHandle(
    [...(node.internals.handleBounds?.source ?? []), ...(node.internals.handleBounds?.target ?? [])],
    pos,
    handleId ?? positionToHandleId(pos),
  );
  return handle ? handleCenter(node.internals.positionAbsolute, handle) : sidePoint(boxOf(node), pos);
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

  const auto = facingSides(boxOf(sourceNode), boxOf(targetNode));
  const sourcePos = (anchorsLocked(sourceNode) ? handleIdToPosition(sourceHandleId) : undefined) ?? auto.sourcePos;
  const targetPos = (anchorsLocked(targetNode) ? handleIdToPosition(targetHandleId) : undefined) ?? auto.targetPos;
  const route = routeAnchors(
    anchorOf(sourceNode, sourcePos, anchorsLocked(sourceNode) ? sourceHandleId : positionToHandleId(sourcePos)),
    anchorOf(targetNode, targetPos, anchorsLocked(targetNode) ? targetHandleId : positionToHandleId(targetPos)),
    sourcePos,
    targetPos,
  );
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
    pathKind === 'straight'
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
