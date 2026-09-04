import { useEffect, useRef, useState } from 'react';

type Props = {
  title: string;
  status: string;
  canUndo: boolean;
  canRedo: boolean;
  equalSwimlaneWidths: boolean;
  onTitle: (value: string) => void;
  onNew: () => void;
  onLoad: () => void;
  onSave: () => void;
  onPng: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFit: () => void;
  onHelp: () => void;
  onEqualSwimlaneWidths: (value: boolean) => void;
};

export function Topbar({
  title,
  status,
  canUndo,
  canRedo,
  equalSwimlaneWidths,
  onTitle,
  onNew,
  onLoad,
  onSave,
  onPng,
  onUndo,
  onRedo,
  onFit,
  onHelp,
  onEqualSwimlaneWidths,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [settingsOpen]);

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
        <div className="settings-wrap" ref={settingsRef}>
          <button
            type="button"
            className={`btn${settingsOpen ? ' is-open' : ''}`}
            onClick={() => setSettingsOpen((open) => !open)}
            aria-expanded={settingsOpen}
            aria-haspopup="true"
            title="Settings"
          >
            Settings
          </button>
          {settingsOpen ? (
            <div className="settings-menu" role="dialog" aria-label="Settings">
              <label className="check">
                <input
                  type="checkbox"
                  checked={equalSwimlaneWidths}
                  onChange={(event) => onEqualSwimlaneWidths(event.target.checked)}
                />
                Match swimlane widths
              </label>
              <p className="field-hint">
                All lanes use the longest width. Drag any lane&apos;s edge to resize them together.
              </p>
            </div>
          ) : null}
        </div>
        <button type="button" className="btn ghost" onClick={onHelp} title="Keyboard shortcuts (?)">
          ?
        </button>
      </div>
    </header>
  );
}
