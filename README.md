# Process Mapper

A browser editor for process maps and value stream maps. Infinite canvas, zoom, swimlanes, and VSM metrics on the steps themselves.

Old v1 JSON files from the previous version still load.

## Run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

```bash
npm test
npm run build
```

`npm run build` writes a static site to `dist/` (relative paths, so it works on GitHub Pages or any static host).

## Use

- **Zoom / pan:** scroll or pinch to zoom, drag empty canvas to pan, **Fit** or `1` to frame the map.
- **Add a node:** drag from the left palette, or click a type then click the canvas.
- **Connect:** drag from a handle. Drop on another node, or on empty canvas to create a task and connect it.
- **Rename:** double-click a node.
- **Swimlanes:** add a lane, then drop nodes onto it. Drag the coloured label to move the lane. Resize from the edges. Deleting a lane keeps its nodes.
- **VSM:** select a step and fill lead time (days), process time (minutes), and/or %C&A. Totals and a timeline use **working hours / day** (default 8), not 24-hour days.
- **Save:** autosaves in this browser. **Save JSON** / `Ctrl+S` downloads a file. **Load** accepts v2 or the old v1 format. **PNG** exports the whole map.

Maps never leave the machine unless you download or host them yourself.

## Shortcuts

| Key | Action |
| --- | --- |
| `Ctrl/Cmd + Z` / `Shift + Z` | Undo / redo |
| `Ctrl/Cmd + S` | Download JSON |
| `Ctrl/Cmd + C` / `V` / `D` | Copy / paste / duplicate |
| `Delete` | Delete selected |
| `Esc` | Cancel / deselect |
| `?` | Shortcut list |

## File format

Version 2 is a JSON document with `title`, `hoursPerDay`, xyflow `nodes` / `edges`, and an optional `viewport`. Version 1 (`nodes`, `connectors`, `swimlanes`, `vsmContainers`) is imported automatically: dotted connectors stay dotted, swimlanes become groups, and VSM boxes attach to the nearest step.
