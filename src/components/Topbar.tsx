type Props = {
  title: string;
  status: string;
  canUndo: boolean;
  canRedo: boolean;
  onTitle: (value: string) => void;
  onNew: () => void;
  onLoad: () => void;
  onSave: () => void;
  onPng: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFit: () => void;
  onHelp: () => void;
};

export function Topbar({
  title,
  status,
  canUndo,
  canRedo,
  onTitle,
  onNew,
  onLoad,
  onSave,
  onPng,
  onUndo,
  onRedo,
  onFit,
  onHelp,
}: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden />
        Process Mapper
      </div>
      <input
        className="title-input"
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        aria-label="Map title"
      />
      <span className="topbar-status">{status}</span>
      <div className="topbar-actions">
        <button type="button" className="btn ghost" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          Undo
        </button>
        <button type="button" className="btn ghost" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
          Redo
        </button>
        <button type="button" className="btn ghost" onClick={onFit} title="Fit view (1)">
          Fit
        </button>
        <button type="button" className="btn" onClick={onNew}>
          New
        </button>
        <button type="button" className="btn" onClick={onLoad}>
          Load
        </button>
        <button type="button" className="btn primary" onClick={onSave}>
          Save JSON
        </button>
        <button type="button" className="btn" onClick={onPng}>
          PNG
        </button>
        <button type="button" className="btn ghost" onClick={onHelp} title="Keyboard shortcuts (?)">
          ?
        </button>
      </div>
    </header>
  );
}
