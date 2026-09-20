#!/usr/bin/env node
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const requiredFiles = [
  // Main entry
  'dist/index.js',
  'dist/index.cjs',
  'dist/index.d.ts',
  // Vite plugin
  'dist/vite.js',
  'dist/vite.cjs',
  'dist/vite.d.ts',
  // Webpack plugin
  'dist/webpack.js',
  'dist/webpack.cjs',
  'dist/webpack.d.ts',
  // Craco plugin
  'dist/craco.js',
  'dist/craco.cjs',
  'dist/craco.d.ts',
];

let allPresent = true;

console.log('Verifying build artifacts...\n');

for (const file of requiredFiles) {
  const fullPath = join(rootDir, file);
  const exists = existsSync(fullPath);

  if (exists) {
    console.log(`✓ ${file}`);
  } else {
    console.error(`✗ ${file} - MISSING`);
    allPresent = false;
  }
}

if (allPresent) {
  console.log('\n✅ All build artifacts present');
  process.exit(0);
} else {
  console.error('\n❌ Some build artifacts are missing');
  process.exit(1);
}
