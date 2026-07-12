// Minimal Vite config: browser target, no node polyfills. The whole point
// of this fixture is to prove that the published library is usable from a
// stock Vite SPA without `vite-plugin-node-polyfills` or any runtime shim.

import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    // Force Vite to pre-bundle the package from `node_modules` so that the
    // CJS dependencies inside it (readable-stream@2, hash-base, ...) are
    // resolved through Vite's dep optimizer instead of being lazily
    // loaded at runtime. This mirrors what a real consumer app does.
    include: ['@maximus-chain/multichain-lib'],
  },
});