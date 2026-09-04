import { KIND_META } from '../constants';
import { PROCESS_KINDS, type ProcessKind } from '../types';
import { Shape } from './nodes/Shape';

type Props = {
  pendingKind: ProcessKind | 'swimlane' | null;
  onPick: (kind: ProcessKind | 'swimlane') => void;
  onDragStart: (kind: ProcessKind | 'swimlane') => void;
};

export function Palette({ pendingKind, onPick, onDragStart }: Props) {
  return (
    <aside className="palette">
      <div className="panel-label">Nodes</div>
      <div className="palette-list">
        {PROCESS_KINDS.map((kind) => {
          const meta = KIND_META[kind];
          return (
            <button
              key={kind}
              type="button"
              className={`palette-item${pendingKind === kind ? ' is-active' : ''}`}
              title={meta.description}
              draggable
              onDragStart={(event) => {
                onDragStart(kind);
                event.dataTransfer.setData('application/process-mapper', kind);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onClick={() => onPick(kind)}
            >
              <span className="palette-shape" aria-hidden>
                <Shape kind={kind} width={36} height={22} selected={false} />
              </span>
              <span className="palette-copy">
                <span className="palette-name">{meta.label}</span>
                <span className="palette-desc">{meta.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="panel-label">Lanes</div>
      <button
        type="button"
        className={`palette-item palette-lane${pendingKind === 'swimlane' ? ' is-active' : ''}`}
        onClick={() => onPick('swimlane')}
        draggable
        onDragStart={(event) => {
          onDragStart('swimlane');
          event.dataTransfer.setData('application/process-mapper', 'swimlane');
          event.dataTransfer.effectAllowed = 'move';
        }}
      >
        <span className="palette-lane-swatch" />
        <span className="palette-copy">
          <span className="palette-name">Swimlane</span>
          <span className="palette-desc">Role or team band. Drop nodes onto it.</span>
        </span>
      </button>
      <p className="palette-hint">
        Drag onto the canvas, or click then click the canvas. Drag a handle to connect — drop on empty
        space to add a task.
      </p>
    </aside>
  );
}
