const SHORTCUTS = [
  ['Scroll / pinch', 'Zoom'],
  ['Drag empty canvas', 'Pan'],
  ['Drag a node', 'Move · snap to others'],
  ['Drag a handle', 'Connect · drop on empty canvas to add a task'],
  ['Double-click a node', 'Rename'],
  ['Shift+drag', 'Box select'],
  ['Delete / Backspace', 'Delete selected'],
  ['Ctrl/Cmd + Z', 'Undo'],
  ['Ctrl/Cmd + Shift + Z', 'Redo'],
  ['Ctrl/Cmd + S', 'Save JSON'],
  ['Ctrl/Cmd + D', 'Duplicate'],
  ['Ctrl/Cmd + C / V', 'Copy / paste'],
  ['1', 'Fit view'],
  ['Esc', 'Cancel stamp mode / deselect'],
  ['?', 'This help'],
];

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="help-backdrop" onClick={onClose} role="presentation">
      <div
        className="help-card"
        role="dialog"
        aria-labelledby="help-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="help-head">
          <h2 id="help-title">Shortcuts</h2>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <dl className="help-list">
          {SHORTCUTS.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
