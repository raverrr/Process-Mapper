import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { KIND_META } from '../constants';
import type { AppNode, ProcessNode } from '../types';
import { downloadDataUrl } from './download';
import { getAbsolutePosition } from './geometry';

export type NodeDetail = {
  id: string;
  kind: string;
  kindColor: string;
  label: string;
  notes: string;
  owners: string;
  vsm: string;
};

export type ExportPngOptions = {
  includeDetails?: boolean;
};

const BG = '#0e0e12';
const TEXT = '#ececf1';
const MUTED = '#9a9aa8';
const LINE = '#2a2a36';
const ACCENT = '#c4a7f7';
const FONT = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';

function isProcess(node: AppNode): node is ProcessNode {
  return node.type === 'process';
}

function vsmLine(data: ProcessNode['data']): string {
  const parts: string[] = [];
  if (data.leadTimeDays != null) parts.push(`LT ${data.leadTimeDays}d`);
  if (data.processTimeMinutes != null) parts.push(`PT ${data.processTimeMinutes}m`);
  if (data.percentCA != null) parts.push(`${data.percentCA}% C&A`);
  return parts.join(' · ');
}

export function collectNodeDetails(nodes: AppNode[]): NodeDetail[] {
  const process = nodes.filter(isProcess);
  const ranked = [...process].sort((a, b) => {
    const ap = getAbsolutePosition(a, nodes);
    const bp = getAbsolutePosition(b, nodes);
    if (Math.abs(ap.y - bp.y) > 48) return ap.y - bp.y;
    return ap.x - bp.x;
  });

  return ranked.flatMap((node) => {
    const notes = (node.data.notes ?? '').trim();
    const owners = (node.data.owners ?? '').trim();
    const vsm = vsmLine(node.data);
    if (!notes && !owners && !vsm) return [];
    const meta = KIND_META[node.data.kind];
    return [
      {
        id: node.id,
        kind: meta.label,
        kindColor: meta.color,
        label: node.data.label,
        notes,
        owners,
        vsm,
      },
    ];
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.replace(/\r\n/g, '\n').split('\n');
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('');
      continue;
    }
    const words = paragraph.split(/\s+/);
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      if (ctx.measureText(word).width <= maxWidth) {
        line = word;
        continue;
      }
      let chunk = '';
      for (const ch of word) {
        if (ctx.measureText(chunk + ch).width <= maxWidth) chunk += ch;
        else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      line = chunk;
    }
    if (line) lines.push(line);
  }
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read the map image.'));
    image.src = src;
  });
}

async function captureMap(nodes: AppNode[]): Promise<string> {
  const viewportEl = document.querySelector('.react-flow__viewport');
  if (!(viewportEl instanceof HTMLElement)) {
    throw new Error('Canvas is not ready.');
  }
  if (nodes.length === 0) {
    throw new Error('Nothing to export.');
  }

  const bounds = getNodesBounds(nodes);
  const width = Math.max(Math.round(bounds.width + 80), 640);
  const height = Math.max(Math.round(bounds.height + 80), 480);
  const viewport = getViewportForBounds(bounds, width, height, 0.2, 2, 0.16);

  return toPng(viewportEl, {
    backgroundColor: BG,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  });
}

function composeDetailsPng(map: HTMLImageElement, title: string, details: NodeDetail[]): string {
  const pad = 40;
  const mapGap = 28;
  const contentWidth = Math.max(map.width, 720);
  const width = contentWidth + pad * 2;
  const mapX = Math.round((width - map.width) / 2);
  const textWidth = width - pad * 2;
  const lineGap = 6;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw the export.');

  ctx.font = `500 22px ${FONT}`;
  const titleY = pad + 22;
  let y = titleY + 18 + mapGap;

  const mapY = y;
  y += map.height + 32;

  ctx.font = `600 13px ${FONT}`;
  y += 18;
  y += 16;

  const blocks = details.map((detail) => {
    ctx.font = `600 15px ${FONT}`;
    const noteLines = detail.notes ? wrapText(ctx, detail.notes, textWidth) : [];
    return { detail, noteLines };
  });

  for (const block of blocks) {
    y += 22;
    y += 16;
    if (block.detail.owners) y += 18;
    if (block.detail.vsm) y += 18;
    if (block.noteLines.length) y += 8 + block.noteLines.length * (15 + lineGap);
    y += 18;
  }

  const height = y + pad;
  const scale = 2;
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = TEXT;
  ctx.font = `500 22px ${FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title.trim() || 'Untitled map', pad, titleY);

  ctx.drawImage(map, mapX, mapY);

  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(pad, mapY + map.height + 16);
  ctx.lineTo(width - pad, mapY + map.height + 16);
  ctx.stroke();

  let cursor = mapY + map.height + 32;
  ctx.fillStyle = ACCENT;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText('Node details', pad, cursor + 14);
  cursor += 34;

  for (const block of blocks) {
    const { detail, noteLines } = block;
    ctx.fillStyle = detail.kindColor;
    ctx.beginPath();
    ctx.roundRect(pad, cursor + 4, 8, 8, 2);
    ctx.fill();

    ctx.fillStyle = MUTED;
    ctx.font = `500 11px ${FONT}`;
    ctx.fillText(detail.kind, pad + 14, cursor + 13);

    ctx.fillStyle = TEXT;
    ctx.font = `600 15px ${FONT}`;
    ctx.fillText(detail.label, pad, cursor + 34);
    cursor += 38;

    if (detail.owners) {
      ctx.fillStyle = MUTED;
      ctx.font = `400 12px ${FONT}`;
      ctx.fillText(`Owners: ${detail.owners}`, pad, cursor + 14);
      cursor += 18;
    }
    if (detail.vsm) {
      ctx.fillStyle = MUTED;
      ctx.font = `400 12px ${FONT}`;
      ctx.fillText(detail.vsm, pad, cursor + 14);
      cursor += 18;
    }
    if (noteLines.length) {
      cursor += 6;
      ctx.fillStyle = TEXT;
      ctx.font = `400 13px ${FONT}`;
      for (const line of noteLines) {
        ctx.fillText(line, pad, cursor + 13);
        cursor += 15 + lineGap;
      }
    }
    cursor += 16;
  }

  return canvas.toDataURL('image/png');
}

export async function exportPng(nodes: AppNode[], title: string, options: ExportPngOptions = {}): Promise<void> {
  const mapUrl = await captureMap(nodes);
  const safe = (title || 'process-map').replace(/[^\w\-]+/g, '_');
  const filename = `${safe || 'process-map'}.png`;

  const details = options.includeDetails ? collectNodeDetails(nodes) : [];
  if (!options.includeDetails || details.length === 0) {
    downloadDataUrl(filename, mapUrl);
    return;
  }

  const map = await loadImage(mapUrl);
  downloadDataUrl(filename, composeDetailsPng(map, title, details));
}
