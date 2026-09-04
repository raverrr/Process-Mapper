import { useUpdateNodeInternals } from '@xyflow/react';
import type { Dispatch, SetStateAction } from 'react';
import { EDGE_COLOR_HEX, EDGE_COLOR_LABELS, KIND_META, KIND_SIZES, PATH_LABELS } from '../constants';
import { edgeVisuals } from '../lib/edgeStyle';
import { computeVsm, formatDuration, trimNumber } from '../model/vsm';
import {
  EDGE_COLORS,
  PATH_KINDS,
  PROCESS_KINDS,
  SWIMLANE_COLORS,
  type AppEdge,
  type AppNode,
  type EdgeColor,
  type PathKind,
  type ProcessKind,
  type ProcessNode,
  type SwimlaneColor,
  type SwimlaneNode,
} from '../types';

type Props = {
  nodes: AppNode[];
  edges: AppEdge[];
  title: string;
  hoursPerDay: number;
  setTitle: (value: string) => void;
  setHoursPerDay: (value: number) => void;
  setNodes: Dispatch<SetStateAction<AppNode[]>>;
  setEdges: Dispatch<SetStateAction<AppEdge[]>>;
  takeSnapshot: () => void;
  onDeleteSelected: () => void;
  onCollapse: () => void;
};

function isProcess(node: AppNode): node is ProcessNode {
  return node.type === 'process';
}

function isLane(node: AppNode): node is SwimlaneNode {
  return node.type === 'swimlane';
}

function ColorSwatches({
  value,
  onChange,
}: {
  value: EdgeColor | null;
  onChange: (color: EdgeColor) => void;
}) {
  return (
    <div className="color-swatches" role="radiogroup" aria-label="Connector color">
      {EDGE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`color-swatch${value === color ? ' is-active' : ''}`}
          style={{ background: EDGE_COLOR_HEX[color] }}
          title={EDGE_COLOR_LABELS[color]}
          aria-label={EDGE_COLOR_LABELS[color]}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}

export function Inspector({
  nodes,
  edges,
  title,
  hoursPerDay,
  setTitle,
  setHoursPerDay,
  setNodes,
  setEdges,
  takeSnapshot,
  onDeleteSelected,
  onCollapse,
}: Props) {
  const updateNodeInternals = useUpdateNodeInternals();
  const selectedNodes = nodes.filter((n) => n.selected);
  const selectedEdges = edges.filter((e) => e.selected);
  const stats = computeVsm(nodes, hoursPerDay);

  const process = selectedNodes.length === 1 && isProcess(selectedNodes[0]) ? selectedNodes[0] : null;
  const lane = selectedNodes.length === 1 && isLane(selectedNodes[0]) ? selectedNodes[0] : null;
  const edge = selectedNodes.length === 0 && selectedEdges.length === 1 ? selectedEdges[0] : null;
  const heading = process
    ? 'Node'
    : lane
      ? 'Swimlane'
      : edge
        ? 'Connector'
        : selectedNodes.length > 1 || selectedEdges.length > 1
          ? 'Selection'
          : 'Map';

  const patchProcess = (id: string, patch: Partial<ProcessNode['data']>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id && n.type === 'process' ? { ...n, data: { ...n.data, ...patch } } : n)),
    );
  };

  const patchLane = (id: string, patch: Partial<SwimlaneNode['data']>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id && n.type === 'swimlane' ? { ...n, data: { ...n.data, ...patch } } : n)),
    );
  };

  const applyEdgeData = (edge: AppEdge, patch: Partial<NonNullable<AppEdge['data']>>) => {
    const data: NonNullable<AppEdge['data']> = { ...(edge.data ?? { path: 'smoothstep' }), ...patch };
    if (patch.color === 'default') {
      delete data.color;
    }
    const look = edgeVisuals(data);
    return {
      ...edge,
      label: data.label || undefined,
      type: 'process' as const,
      animated: Boolean(data.dashed),
      style: look.style,
      markerEnd: look.markerEnd,
      data,
    };
  };

  const patchEdge = (id: string, patch: Partial<NonNullable<AppEdge['data']>> & { label?: string }) => {
    setEdges((eds) => eds.map((e) => (e.id === id ? applyEdgeData(e, patch) : e)));
  };

  const colorSelectedEdges = (color: EdgeColor) => {
    takeSnapshot();
    const ids = new Set(selectedEdges.map((item) => item.id));
    setEdges((eds) => eds.map((e) => (ids.has(e.id) ? applyEdgeData(e, { color }) : e)));
  };

  const sharedEdgeColor: EdgeColor | null =
    selectedEdges.length > 0 &&
    selectedEdges.every((item) => (item.data?.color ?? 'default') === (selectedEdges[0].data?.color ?? 'default'))
      ? (selectedEdges[0].data?.color ?? 'default')
      : null;

  return (
    <aside className="inspector">
      <div className="panel-head">
        <div className="panel-label">{heading}</div>
        <button
          type="button"
          className="btn ghost pane-toggle"
          onClick={onCollapse}
          title="Hide inspector (])"
          aria-label="Hide inspector"
        >
          ›
        </button>
      </div>
      {process ? (
        <>
          <label className="field">
            <span>Type</span>
            <select
              className="nodrag"
              value={process.data.kind}
              onFocus={takeSnapshot}
              onChange={(e) => {
                const kind = e.target.value as ProcessKind;
                const size = KIND_SIZES[kind];
                setNodes((nds) =>
                  nds.map((n) =>
                    n.id === process.id && n.type === 'process'
                      ? {
                          ...n,
                          style: { ...n.style, width: size.w, height: size.h },
                          data: { ...n.data, kind },
                        }
                      : n,
                  ),
                );
                requestAnimationFrame(() => updateNodeInternals(process.id));
              }}
            >
              {PROCESS_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {KIND_META[kind].label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Name</span>
            <input
              value={process.data.label}
              onFocus={takeSnapshot}
              onChange={(e) => patchProcess(process.id, { label: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Notes</span>
            <textarea
              rows={4}
              value={process.data.notes}
              onFocus={takeSnapshot}
              onChange={(e) => patchProcess(process.id, { notes: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Owners</span>
            <input
              value={process.data.owners}
              onFocus={takeSnapshot}
              onChange={(e) => patchProcess(process.id, { owners: e.target.value })}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={Boolean(process.data.lockAnchors)}
              onChange={(e) => {
                takeSnapshot();
                patchProcess(process.id, { lockAnchors: e.target.checked });
              }}
            />
            Lock connector anchors
          </label>
          <p className="field-hint">
            Keep this node&apos;s edges on the handles you connected. Off, they hop to the nearest side.
          </p>
          <div className="panel-label">Value stream</div>
          <p className="field-hint">Leave blank to exclude this step from VSM totals.</p>
          <div className="field-row">
            <label className="field">
              <span>Lead time (days)</span>
              <input
                type="number"
                min={0}
                step={0.1}
                value={process.data.leadTimeDays ?? ''}
                onFocus={takeSnapshot}
                onChange={(e) =>
                  patchProcess(process.id, {
                    leadTimeDays: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              <span>Process time (min)</span>
              <input
                type="number"
                min={0}
                step={1}
                value={process.data.processTimeMinutes ?? ''}
                onFocus={takeSnapshot}
                onChange={(e) =>
                  patchProcess(process.id, {
                    processTimeMinutes: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </div>
          <label className="field">
            <span>% Complete &amp; accurate</span>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={process.data.percentCA ?? ''}
              onFocus={takeSnapshot}
              onChange={(e) =>
                patchProcess(process.id, {
                  percentCA: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </label>
          <button type="button" className="btn danger" onClick={onDeleteSelected}>
            Delete node
          </button>
        </>
      ) : lane ? (
        <>

          <label className="field">
            <span>Label</span>
            <input
              value={lane.data.label}
              onFocus={takeSnapshot}
              onChange={(e) => patchLane(lane.id, { label: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Color</span>
            <select
              value={lane.data.color}
              onFocus={takeSnapshot}
              onChange={(e) => patchLane(lane.id, { color: e.target.value as SwimlaneColor })}
            >
              {SWIMLANE_COLORS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </label>
          <p className="field-hint">Deleting a lane keeps the nodes in it.</p>
          <button type="button" className="btn danger" onClick={onDeleteSelected}>
            Delete lane
          </button>
        </>
      ) : edge ? (
        <>

          <label className="field">
            <span>Label</span>
            <input
              value={edge.data?.label ?? (typeof edge.label === 'string' ? edge.label : '')}
              placeholder="Yes / No / handoff…"
              onFocus={takeSnapshot}
              onChange={(e) => patchEdge(edge.id, { label: e.target.value })}
            />
          </label>
          <div className="field">
            <span>Color</span>
            <ColorSwatches
              value={edge.data?.color ?? 'default'}
              onChange={(color) => {
                takeSnapshot();
                patchEdge(edge.id, { color });
              }}
            />
          </div>
          <p className="field-hint">Paint a path through a busy map. Default is the usual grey.</p>
          <label className="field">
            <span>Path</span>
            <select
              value={edge.data?.path ?? 'smoothstep'}
              onFocus={takeSnapshot}
              onChange={(e) => patchEdge(edge.id, { path: e.target.value as PathKind })}
            >
              {PATH_KINDS.map((path) => (
                <option key={path} value={path}>
                  {PATH_LABELS[path]}
                </option>
              ))}
            </select>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={Boolean(edge.data?.dashed)}
              onChange={(e) => {
                takeSnapshot();
                patchEdge(edge.id, { dashed: e.target.checked });
              }}
            />
            Dotted
          </label>
          <button type="button" className="btn danger" onClick={onDeleteSelected}>
            Delete connector
          </button>
        </>
      ) : selectedNodes.length > 1 || selectedEdges.length > 1 ? (
        <>

          <p className="field-hint">
            {selectedNodes.length} node{selectedNodes.length === 1 ? '' : 's'}, {selectedEdges.length}{' '}
            connector{selectedEdges.length === 1 ? '' : 's'}.
          </p>
          {selectedEdges.length > 0 ? (
            <div className="field">
              <span>Connector color</span>
              <ColorSwatches value={sharedEdgeColor} onChange={colorSelectedEdges} />
            </div>
          ) : null}
          <button type="button" className="btn danger" onClick={onDeleteSelected}>
            Delete selected
          </button>
        </>
      ) : (
        <>

          <label className="field">
            <span>Title</span>
            <input value={title} onFocus={takeSnapshot} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            <span>Working hours / day</span>
            <input
              type="number"
              min={1}
              max={24}
              step={0.5}
              value={hoursPerDay}
              onFocus={takeSnapshot}
              onChange={(e) => setHoursPerDay(Number(e.target.value) || 8)}
            />
          </label>
          <p className="field-hint">
            PCE uses lead time in days × hours × 60, not 24-hour days. Typical lean maps use available time
            (often 8).
          </p>
          <div className="panel-label">Totals</div>
          <dl className="stats">
            <div>
              <dt>Nodes</dt>
              <dd>{nodes.filter((n) => n.type === 'process').length}</dd>
            </div>
            <div>
              <dt>Connectors</dt>
              <dd>{edges.length}</dd>
            </div>
            <div>
              <dt>Rolled %C&amp;A</dt>
              <dd>{stats.rolledCA == null ? '—' : `${stats.rolledCA.toFixed(2)}%`}</dd>
            </div>
            <div>
              <dt>PCE</dt>
              <dd>{stats.pce == null ? '—' : `${stats.pce.toFixed(2)}%`}</dd>
            </div>
            <div>
              <dt>Lead time</dt>
              <dd>{formatDuration(stats.sumLeadMinutes, hoursPerDay)}</dd>
            </div>
            <div>
              <dt>Process time</dt>
              <dd>{formatDuration(stats.sumProcessMinutes, hoursPerDay)}</dd>
            </div>
          </dl>
          {stats.steps.length > 0 ? (
            <p className="field-hint">
              {stats.steps.length} step{stats.steps.length === 1 ? '' : 's'} in the VSM · product of C&amp;A
              {stats.rolledCA != null ? ` = ${trimNumber(stats.rolledCA)}%` : ''}.
            </p>
          ) : (
            <p className="field-hint">Add lead time, process time, or %C&amp;A on a node to start a VSM.</p>
          )}
        </>
      )}
    </aside>
  );
}
