import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Force font files to base64-inline so the standalone build stays a single
    // self-contained file. The default 4 KB threshold would leave the ~19 KB
    // woff2 faces and the ~300-400 KB ttf faces (used to outline curved text
    // for laser-software SVG export) as external requests, which breaks over
    // file://.
    assetsInlineLimit: (filePath) =>
      filePath.endsWith('.woff2') || filePath.endsWith('.ttf') ? true : undefined,
  },
  server: {
    port: 3000,
  },
});
