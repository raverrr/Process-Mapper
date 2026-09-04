# Process Mapper

A browser editor for process maps and value stream maps. Infinite canvas, zoom, swimlanes, and VSM metrics on the steps themselves.

**Use it here:** [https://raverrr.github.io/Process-Mapper/](https://raverrr.github.io/Process-Mapper/)

Maps stay in your browser (localStorage + JSON download). Old v1 JSON files still load.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

```bash
npm test
npm run build
```

Production builds on GitHub Actions use the `/Process-Mapper/` base path so assets load on GitHub Pages. Local `npm run dev` / `npm run build` keep relative paths.

## Use

- **Zoom / pan:** scroll or pinch to zoom. Drag empty canvas **or a swimlane** to pan. **Space+drag** or **middle-mouse drag** pans over nodes too. **Fit** or `1` frames the map.
- **Add a node:** drag from the left palette, or click a type then click the canvas.
- **Connect:** drag from a handle. Drop on another node, or on empty canvas to create a task and connect it.
- **Rename:** double-click a node.
- **Swimlanes:** add a lane, then drop nodes onto it. Drag the coloured label to move the lane. Resize from the edges. Deleting a lane keeps its nodes.
- **VSM:** select a step and fill lead time (days), process time (minutes), and/or %C&A. Totals and a timeline use **working hours / day** (default 8), not 24-hour days.
- **Save:** autosaves in this browser. **Save JSON** / `Ctrl+S` downloads a file. **Load** accepts v2 or the old v1 format. **PNG** exports the whole map.
- **Panes:** collapse Nodes or Inspector with the chevron, or `[` / `]`. Tabs on the canvas edges bring them back.

## Shortcuts

| Key | Action |
| --- | --- |
| `Ctrl/Cmd + Z` / `Shift + Z` | Undo / redo |
| `Ctrl/Cmd + S` | Download JSON |
| `Ctrl/Cmd + C` / `V` / `D` | Copy / paste / duplicate |
| `Delete` | Delete selected |
| `[` / `]` | Show / hide nodes pane / inspector |
| `Space` + drag | Pan (works over nodes and lanes) |
| `Esc` | Cancel / deselect |
| `?` | Shortcut list |

## File format

Version 2 is a JSON document with `title`, `hoursPerDay`, xyflow `nodes` / `edges`, and an optional `viewport`. Version 1 (`nodes`, `connectors`, `swimlanes`, `vsmContainers`) is imported automatically: dotted connectors stay dotted, swimlanes become groups, and VSM boxes attach to the nearest step.
