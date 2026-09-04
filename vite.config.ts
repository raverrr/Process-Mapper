import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function assetBase(): string {
  const raw = process.env.BASE_PATH;
  if (!raw || raw === './') return './';
  if (raw === '/') return '/';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site needs /Process-Mapper/. Local dev/preview keep relative paths.
  base: assetBase(),
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
});
