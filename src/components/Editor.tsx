import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type FinalConnectionState,
  type NodeChange,
  type OnConnectEnd,
  type OnNodeDrag,
} from '@xyflow/react';
import { useCallback, useEffect, useRef, useState, type DragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { KIND_META, KIND_SIZES } from '../constants';
import { useHistory, type Snapshot } from '../hooks/useHistory';
import { useUiPrefs } from '../hooks/useUiPrefs';
import { createEdge, createProcessNode, createSwimlaneNode } from '../lib/factory';
import { exportPng } from '../lib/exportImage';
import { downloadText } from '../lib/download';
import {
  applyEqualSwimlaneWidth,
  attachToLane,
  detachFromParent,
  getAbsolutePosition,
  laneAtPoint,
  maxSwimlaneWidth,
  nextSwimlanePosition,
  nodeSize,
  sortParentsFirst,
} from '../lib/geometry';
import { snapCenterToGrid, snapPosition, type HelperLines } from '../lib/helpers';
import { nextId } from '../lib/ids';
import {
  emptyDocument,
  fileNameFor,
  loadAutosave,
  parseMap,
  saveAutosave,
  toDocument,
} from '../model/document';
import type { AppEdge, AppNode, ProcessKind } from '../types';
import { HelperLinesOverlay } from './HelperLines';
import { HelpOverlay } from './HelpOverlay';
import { Inspector } from './Inspector';
import { Palette } from './Palette';
import { Topbar } from './Topbar';
import { VsmTimeline } from './VsmTimeline';
import { OverviewMap } from './OverviewMap';
import { edgeTypes, nodeTypes } from './nodes';

const boot = loadAutosave() ?? emptyDocument();

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function pointerClient(event: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('changedTouches' in event && event.changedTouches[0]) {
    return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }
  return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
}

export function Editor() {
  const { screenToFlowPosition, fitView, getViewport, deleteElements, setViewport } = useReactFlow();
  const [title, setTitle] = useState(boot.title);
  const [hoursPerDay, setHoursPerDay] = useState(boot.hoursPerDay);
  const [nodes, setNodes] = useNodesState(boot.nodes);
  const [edges, setEdges, onEdgesChangeDefault] = useEdgesState(boot.edges);
  const [pendingKind, setPendingKind] = useState<ProcessKind | 'swimlane' | null>(null);
  const [helperLines, setHelperLines] = useState<HelperLines>({});
  const [status, setStatus] = useState(loadAutosave() ? 'Restored local draft' : '');
  const [helpOpen, setHelpOpen] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const panModeRef = useRef(false);
  panModeRef.current = panMode;
  const {
    paletteOpen,
    setPaletteOpen,
    inspectorOpen,
    setInspectorOpen,
    equalSwimlaneWidths,
    setEqualSwimlaneWidths,
  } = useUiPrefs();
  const fileRef = useRef<HTMLInputElement>(null);
  const clipboard = useRef<{ nodes: AppNode[]; edges: AppEdge[] } | null>(null);
  const dragKind = useRef<ProcessKind | 'swimlane' | null>(null);
  const history = useHistory();
  const stateRef = useRef<Snapshot>({ nodes, edges, title, hoursPerDay });
  stateRef.current = { nodes, edges, title, hoursPerDay };

  const snap = useCallback(() => {
    history.takeSnapshot(stateRef.current);
  }, [history]);

  const applySnap = useCallback(
    (snapshot: Snapshot) => {
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setTitle(snapshot.title);
      setHoursPerDay(snapshot.hoursPerDay);
    },
    [setEdges, setNodes],
  );

  const flash = useCallback((message: string) => {
    setStatus(message);
  }, []);

  useEffect(() => {
    document.title = title.trim() ? `${title.trim()} · Process Mapper` : 'Process Mapper';
  }, [title]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveAutosave(toDocument(title, hoursPerDay, nodes, edges, getViewport()));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [nodes, edges, title, hoursPerDay, getViewport]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(''), 2400);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!equalSwimlaneWidths) return;
    setNodes((current) => applyEqualSwimlaneWidth(current, maxSwimlaneWidth(current)));
  }, [equalSwimlaneWidths, setNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<AppNode>[]) => {
      let dragging = false;
      let helperLines: HelperLines = {};
      for (const change of changes) {
        if (change.type !== 'position' || !change.position) continue;
        const node = nodes.find((item) => item.id === change.id);
        if (!node || node.type === 'swimlane') continue;
        const snapped = snapPosition(change.id, change.position, nodes);
        change.position = snapped.position;
        if (change.dragging) {
          dragging = true;
          helperLines = snapped.lines;
        }
      }
      if (dragging) setHelperLines(helperLines);
      else if (!changes.some((change) => change.type === 'position' && change.dragging)) {
        setHelperLines({});
      }

      const removes = changes.filter((change) => change.type === 'remove');
      if (removes.length) {
        const ids = new Set(removes.map((change) => change.id));
        setNodes((current) => {
          const laneIds = new Set(
            current.filter((node) => ids.has(node.id) && node.type === 'swimlane').map((node) => node.id),
          );
          const prepared = laneIds.size
            ? current.map((node) =>
                node.parentId && laneIds.has(node.parentId) ? detachFromParent(node, current) : node,
              )
            : current;
          return applyNodeChanges(changes, prepared);
        });
        return;
      }

      setNodes((current) => {
        let next = applyNodeChanges(changes, current);
        if (equalSwimlaneWidths) {
          for (const change of changes) {
            if (change.type !== 'dimensions' || !change.dimensions) continue;
            const before = current.find((item) => item.id === change.id);
            if (before?.type !== 'swimlane') continue;
            next = applyEqualSwimlaneWidth(next, change.dimensions.width);
            break;
          }
        }
        return next;
      });
    },
    [equalSwimlaneWidths, nodes, setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<AppEdge>[]) => {
      onEdgesChangeDefault(changes);
    },
    [onEdgesChangeDefault],
  );

  const onNodeDragStop: OnNodeDrag<AppNode> = useCallback(
    (_event, node) => {
      snap();
      if (node.type === 'swimlane') return;
      setNodes((current) => {
        const live = current.find((item) => item.id === node.id);
        if (!live || live.type === 'swimlane') return current;
        const abs = getAbsolutePosition(live, current);
        const size = nodeSize(live);
        const lane = laneAtPoint({ x: abs.x + size.w / 2, y: abs.y + size.h / 2 }, current);
        let next: AppNode = live;
        if (lane) {
          if (live.parentId !== lane.id) next = attachToLane(live, lane, current);
        } else if (live.parentId) {
          next = detachFromParent(live, current);
        }
        if (next === live) return current;
        return sortParentsFirst(current.map((item) => (item.id === live.id ? next : item)));
      });
    },
    [setNodes, snap],
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return;
      snap();
      setEdges((current) =>
        current.concat(
          createEdge(params.source, params.target, {
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle,
          }),
        ),
      );
    },
    [setEdges, snap],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, state: FinalConnectionState) => {
      if (state.toNode || !state.fromNode) return;
      const client = pointerClient(event);
      const position = screenToFlowPosition({ x: client.x, y: client.y });
      const node = createProcessNode('task', position);
      snap();
      setNodes((current) => {
        const lane = laneAtPoint(position, current);
        const placed = lane ? attachToLane(node, lane, [...current, node]) : node;
        return sortParentsFirst(current.concat(placed));
      });
      setEdges((current) =>
        current.concat(
          createEdge(state.fromNode!.id, node.id, {
            sourceHandle: state.fromHandle?.id,
          }),
        ),
      );
    },
    [screenToFlowPosition, setEdges, setNodes, snap],
  );

  const placeAt = useCallback(
    (position: { x: number; y: number }, kind: ProcessKind | 'swimlane') => {
      snap();
      if (kind === 'swimlane') {
        setNodes((current) => {
          const width = equalSwimlaneWidths ? maxSwimlaneWidth(current) : undefined;
          return sortParentsFirst(current.concat(createSwimlaneNode(position, 'Lane', 'blue', width)));
        });
        return;
      }
      const size = KIND_SIZES[kind];
      const node = createProcessNode(kind, snapCenterToGrid(position, size));
      setNodes((current) => {
        const lane = laneAtPoint(node.position, current);
        const placed = lane ? attachToLane(node, lane, [...current, node]) : node;
        return sortParentsFirst(current.concat(placed));
      });
    },
    [equalSwimlaneWidths, setNodes, snap],
  );

  const onPaneClick = useCallback(
    (event: ReactMouseEvent) => {
      if (panModeRef.current || !pendingKind) return;
      placeAt(screenToFlowPosition({ x: event.clientX, y: event.clientY }), pendingKind);
      setPendingKind(null);
    },
    [pendingKind, placeAt, screenToFlowPosition],
  );

  const onNodeClick = useCallback(
    (_event: ReactMouseEvent, node: AppNode) => {
      if (panModeRef.current || !pendingKind || pendingKind === 'swimlane' || node.type === 'swimlane') return;
      const size = nodeSize(node);
      const createdSize = KIND_SIZES[pendingKind];
      const created = createProcessNode(pendingKind, {
        x: node.position.x + size.w + 72,
        y: node.position.y + size.h / 2 - createdSize.h / 2,
      });
      if (node.parentId) created.parentId = node.parentId;
      snap();
      setNodes((current) => sortParentsFirst(current.concat(created)));
      setEdges((current) => current.concat(createEdge(node.id, created.id)));
      setPendingKind(null);
    },
    [pendingKind, setEdges, setNodes, snap],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const kind = (event.dataTransfer.getData('application/process-mapper') ||
        dragKind.current) as ProcessKind | 'swimlane' | null;
      dragKind.current = null;
      if (!kind) return;
      placeAt(screenToFlowPosition({ x: event.clientX, y: event.clientY }), kind);
      setPendingKind(null);
    },
    [placeAt, screenToFlowPosition],
  );

  const selectedNodes = nodes.filter((node) => node.selected);
  const selectedEdges = edges.filter((edge) => edge.selected);

  const onDeleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    snap();
    void deleteElements({ nodes: selectedNodes, edges: selectedEdges });
  }, [deleteElements, selectedEdges, selectedNodes, snap]);

  const copySelection = useCallback(() => {
    if (selectedNodes.length === 0) return;
    const ids = new Set(selectedNodes.map((node) => node.id));
    clipboard.current = {
      nodes: selectedNodes,
      edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
    };
    flash('Copied');
  }, [edges, flash, selectedNodes]);

  const pasteClipboard = useCallback(() => {
    const clip = clipboard.current;
    if (!clip) return;
    snap();
    const idMap = new Map<string, string>();
    const clonedNodes: AppNode[] = clip.nodes.map((node) => {
      const id = nextId(node.type === 'swimlane' ? 'lane' : 'n');
      idMap.set(node.id, id);
      return {
        ...node,
        id,
        selected: true,
        position: { x: node.position.x + 40, y: node.position.y + 40 },
        data: structuredClone(node.data),
      } as AppNode;
    });
    for (const node of clonedNodes) {
      if (node.parentId) node.parentId = idMap.get(node.parentId) ?? node.parentId;
    }
    const clonedEdges = clip.edges.flatMap((edge) => {
      const source = idMap.get(edge.source);
      const target = idMap.get(edge.target);
      if (!source || !target) return [];
      return [
        {
          ...createEdge(source, target, {
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            label: edge.data?.label,
            path: edge.data?.path,
            dashed: edge.data?.dashed,
          }),
          selected: true,
        },
      ];
    });
    setNodes((current) => {
      const deselected: AppNode[] = current.map((node) => ({ ...node, selected: false }));
      return sortParentsFirst(deselected.concat(clonedNodes));
    });
    setEdges((current) => current.map((edge) => ({ ...edge, selected: false })).concat(clonedEdges));
  }, [setEdges, setNodes, snap]);

  const addSwimlane = useCallback(() => {
    snap();
    setNodes((current) => {
      const width = equalSwimlaneWidths ? maxSwimlaneWidth(current) : undefined;
      return sortParentsFirst(
        current.concat(createSwimlaneNode(nextSwimlanePosition(current), 'Lane', 'blue', width)),
      );
    });
  }, [equalSwimlaneWidths, setNodes, snap]);

  const onNew = useCallback(() => {
    if (!window.confirm('Start a new map? The current one is already autosaved in this browser.')) return;
    const fresh = emptyDocument();
    history.reset();
    setTitle(fresh.title);
    setHoursPerDay(fresh.hoursPerDay);
    setNodes(fresh.nodes);
    setEdges(fresh.edges);
    window.setTimeout(() => fitView({ padding: 0.25 }), 0);
    flash('New map');
  }, [fitView, flash, history, setEdges, setNodes]);

  const onSave = useCallback(() => {
    const doc = toDocument(title, hoursPerDay, nodes, edges, getViewport());
    downloadText(fileNameFor(title), JSON.stringify(doc, null, 2));
    flash('JSON downloaded');
  }, [edges, flash, getViewport, hoursPerDay, nodes, title]);

  const onLoadFile = useCallback(
    async (file: File) => {
      try {
        const parsed = parseMap(JSON.parse(await file.text()));
        history.reset();
        setTitle(parsed.doc.title);
        setHoursPerDay(parsed.doc.hoursPerDay);
        setNodes(
          equalSwimlaneWidths
            ? applyEqualSwimlaneWidth(parsed.doc.nodes, maxSwimlaneWidth(parsed.doc.nodes))
            : parsed.doc.nodes,
        );
        setEdges(parsed.doc.edges);
        window.setTimeout(() => {
          if (parsed.doc.viewport) setViewport(parsed.doc.viewport);
          else fitView({ padding: 0.2 });
        }, 0);
        flash(parsed.migratedFromV1 ? 'Imported v1 map' : 'Map loaded');
      } catch (error) {
        flash(error instanceof Error ? error.message : 'Could not load file');
      }
    },
    [equalSwimlaneWidths, fitView, flash, history, setEdges, setNodes, setViewport],
  );

  const onPng = useCallback(async () => {
    try {
      await exportPng(nodes, title);
      flash('PNG downloaded');
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Export failed');
    }
  }, [flash, nodes, title]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || isTypingTarget(event.target)) return;
      event.preventDefault();
      if (!event.repeat) setPanMode(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setPanMode(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button === 1) {
        event.preventDefault();
        setPanMode(true);
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      if (event.button === 1) setPanMode(false);
    };
    const endPan = () => setPanMode(false);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('blur', endPan);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('blur', endPan);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = isTypingTarget(event.target);
      const meta = event.metaKey || event.ctrlKey;

      if (event.key === '?' && !typing) {
        event.preventDefault();
        setHelpOpen((open) => !open);
        return;
      }
      if (event.key === 'Escape') {
        setPendingKind(null);
        setHelpOpen(false);
        if (!typing) {
          setNodes((current) => current.map((node) => ({ ...node, selected: false })));
          setEdges((current) => current.map((edge) => ({ ...edge, selected: false })));
        }
        return;
      }
      if (event.key === '1' && !typing && !meta) {
        event.preventDefault();
        void fitView({ padding: 0.2 });
        return;
      }
      if (event.key === '[' && !typing && !meta) {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (event.key === ']' && !typing && !meta) {
        event.preventDefault();
        setInspectorOpen((open) => !open);
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !typing) {
        snap();
        return;
      }
      if (!meta) return;
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        onSave();
      } else if (event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        const next = history.redo(stateRef.current);
        if (next) applySnap(next);
      } else if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        const previous = history.undo(stateRef.current);
        if (previous) applySnap(previous);
      } else if (event.key.toLowerCase() === 'c' && !typing) {
        event.preventDefault();
        copySelection();
      } else if (event.key.toLowerCase() === 'v' && !typing) {
        event.preventDefault();
        pasteClipboard();
      } else if (event.key.toLowerCase() === 'd' && !typing) {
        event.preventDefault();
        copySelection();
        pasteClipboard();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    applySnap,
    copySelection,
    fitView,
    history,
    onSave,
    pasteClipboard,
    setEdges,
    setInspectorOpen,
    setNodes,
    setPaletteOpen,
    snap,
  ]);

  const pickKind = (kind: ProcessKind | 'swimlane') => {
    if (kind === 'swimlane' && pendingKind !== 'swimlane') {
      setPendingKind(kind);
      return;
    }
    setPendingKind((current) => (current === kind ? null : kind));
  };

  return (
    <div className={`shell${pendingKind ? ' is-stamping' : ''}${panMode ? ' is-panning' : ''}`}>
      <Topbar
        title={title}
        status={status}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onTitle={setTitle}
        onNew={onNew}
        onLoad={() => fileRef.current?.click()}
        onSave={onSave}
        onPng={() => void onPng()}
        onUndo={() => {
          const previous = history.undo(stateRef.current);
          if (previous) applySnap(previous);
        }}
        onRedo={() => {
          const next = history.redo(stateRef.current);
          if (next) applySnap(next);
        }}
        onFit={() => void fitView({ padding: 0.2 })}
        onHelp={() => setHelpOpen(true)}
        equalSwimlaneWidths={equalSwimlaneWidths}
        onEqualSwimlaneWidths={setEqualSwimlaneWidths}
      />
      <div
        className={`workspace${paletteOpen ? '' : ' palette-collapsed'}${inspectorOpen ? '' : ' inspector-collapsed'}`}
      >
        <Palette
          pendingKind={pendingKind}
          onPick={(kind) => {
            if (kind === 'swimlane') {
              addSwimlane();
              setPendingKind(null);
              return;
            }
            pickKind(kind);
          }}
          onDragStart={(kind) => {
            dragKind.current = kind;
          }}
          onCollapse={() => setPaletteOpen(false)}
        />
        <div className="canvas-wrap">
          {paletteOpen ? null : (
            <button
              type="button"
              className="pane-tab pane-tab-left"
              onClick={() => setPaletteOpen(true)}
              title="Show nodes pane ([)"
            >
              Nodes
            </button>
          )}
          {inspectorOpen ? null : (
            <button
              type="button"
              className="pane-tab pane-tab-right"
              onClick={() => setInspectorOpen(true)}
              title="Show inspector (])"
            >
              Inspector
            </button>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectEnd={onConnectEnd}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionRadius={40}
            minZoom={0.12}
            maxZoom={2.4}
            zoomOnDoubleClick={false}
            panOnDrag={[0, 1, 2]}
            nodesDraggable={!panMode}
            deleteKeyCode={['Backspace', 'Delete']}
            multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
            edgesReconnectable
            elevateNodesOnSelect
            colorMode="dark"
            fitView={false}
            defaultViewport={boot.viewport ?? { x: 40, y: 24, zoom: 1 }}
            onNodeClick={onNodeClick}
            defaultEdgeOptions={{
              type: 'process',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#c8c8d4', width: 16, height: 16 },
            }}
            isValidConnection={(c) => c.source !== c.target}
            proOptions={{ hideAttribution: false }}
          >
            <Background
              id="dots"
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1.1}
              color="rgba(196,167,247,0.16)"
            />
            <Controls showInteractive={false} />
            <OverviewMap />
            <HelperLinesOverlay lines={helperLines} />
            <Panel position="top-left" className="canvas-hint">
              {pendingKind
                ? `Click the canvas to place ${pendingKind === 'swimlane' ? 'a swimlane' : KIND_META[pendingKind].label}. Esc cancels.`
                : panMode
                  ? 'Drag to pan'
                  : 'Scroll to zoom · drag empty space or a lane to pan · Space/middle-drag anywhere'}
            </Panel>
            <Panel position="bottom-left" className="vsm-panel">
              <VsmTimeline nodes={nodes} hoursPerDay={hoursPerDay} />
            </Panel>
          </ReactFlow>
        </div>
        <Inspector
          nodes={nodes}
          edges={edges}
          title={title}
          hoursPerDay={hoursPerDay}
          setTitle={setTitle}
          setHoursPerDay={setHoursPerDay}
          setNodes={setNodes}
          setEdges={setEdges}
          takeSnapshot={snap}
          onDeleteSelected={onDeleteSelected}
          onCollapse={() => setInspectorOpen(false)}
        />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onLoadFile(file);
          event.target.value = '';
        }}
      />
      {helpOpen ? <HelpOverlay onClose={() => setHelpOpen(false)} /> : null}
    </div>
  );
}
