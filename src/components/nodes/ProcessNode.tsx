import { Handle, NodeToolbar, Position, useReactFlow, type NodeProps } from '@xyflow/react';
import { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { KIND_META, KIND_SIZES } from '../../constants';
import type { ProcessNode as ProcessNodeType } from '../../types';
import { Shape } from './Shape';

function vsmSummary(data: ProcessNodeType['data']): string | null {
  if (data.leadTimeDays == null && data.processTimeMinutes == null && data.percentCA == null) {
    return null;
  }
  const parts: string[] = [];
  if (data.leadTimeDays != null) parts.push(`LT ${data.leadTimeDays}d`);
  if (data.processTimeMinutes != null) parts.push(`PT ${data.processTimeMinutes}m`);
  if (data.percentCA != null) parts.push(`${data.percentCA}%`);
  return parts.join(' · ');
}

function ProcessNodeComponent({ id, data, selected }: NodeProps<ProcessNodeType>) {
  const { updateNodeData } = useReactFlow();
  const size = KIND_SIZES[data.kind];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const badge = vsmSummary(data);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = useCallback(() => {
    const next = draft.trim() || KIND_META[data.kind].defaultName;
    updateNodeData(id, { label: next });
    setEditing(false);
  }, [draft, data.kind, id, updateNodeData]);

  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commit();
    if (event.key === 'Escape') {
      setDraft(data.label);
      setEditing(false);
    }
  };

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <span className="node-toolbar-chip">{KIND_META[data.kind].label}</span>
      </NodeToolbar>
      <div
        className={`process-node kind-${data.kind}${selected ? ' is-selected' : ''}`}
        style={{ width: size.w, height: size.h }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          setDraft(data.label);
          setEditing(true);
        }}
      >
        <Shape kind={data.kind} width={size.w} height={size.h} selected={Boolean(selected)} />
        <div className="process-node-label">
          {editing ? (
            <input
              ref={inputRef}
              className="nodrag nopan process-node-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={onKey}
            />
          ) : (
            <span>{data.label}</span>
          )}
        </div>
        {badge ? <div className="process-node-vsm">{badge}</div> : null}
        <Handle type="source" position={Position.Top} id="t" />
        <Handle type="source" position={Position.Right} id="r" />
        <Handle type="source" position={Position.Bottom} id="b" />
        <Handle type="source" position={Position.Left} id="l" />
      </div>
    </>
  );
}

export const ProcessNode = memo(ProcessNodeComponent);
