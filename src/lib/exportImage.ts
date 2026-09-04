import { getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import type { AppNode } from '../types';
import { downloadDataUrl } from './download';

export async function exportPng(nodes: AppNode[], title: string): Promise<void> {
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

  const dataUrl = await toPng(viewportEl, {
    backgroundColor: '#0e0e12',
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
  });

  const safe = (title || 'process-map').replace(/[^\w\-]+/g, '_');
  downloadDataUrl(`${safe || 'process-map'}.png`, dataUrl);
}
