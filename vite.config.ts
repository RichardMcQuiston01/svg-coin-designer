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
    // woff2 faces as external requests, which breaks over file://.
    assetsInlineLimit: (filePath) =>
      filePath.endsWith('.woff2') ? true : undefined,
  },
  server: {
    port: 3000,
  },
});
