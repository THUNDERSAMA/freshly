import { defineConfig } from 'tsup';

export default defineConfig([
  // Runtime entry (browser)
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    platform: 'browser',
    external: ['react', 'react-dom'],
    splitting: false,
    treeshake: true,
  },
  // Vite plugin (Node.js)
  {
    entry: { vite: 'src/vite/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    platform: 'node',
    external: ['vite'],
    splitting: false,
  },
  // Webpack plugin (Node.js)
  {
    entry: { webpack: 'src/webpack/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    platform: 'node',
    external: ['webpack'],
    splitting: false,
  },
  // Craco plugin (Node.js)
  {
    entry: { craco: 'src/craco/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    platform: 'node',
    external: ['webpack'],
    splitting: false,
  },
]);
