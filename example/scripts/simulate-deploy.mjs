#!/usr/bin/env node
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');
const versionFile = join(distDir, 'version.json');

if (!existsSync(distDir)) {
  console.error('❌ dist/ directory not found. Run `npm run build` first.');
  process.exit(1);
}

// Generate a new random version ID
const newVersion = randomBytes(4).toString('hex');
const builtAt = new Date().toISOString();

const manifest = {
  version: newVersion,
  builtAt,
};

writeFileSync(versionFile, JSON.stringify(manifest, null, 2));

console.log('✅ Simulated deployment');
console.log(`   New version: ${newVersion}`);
console.log(`   Built at: ${builtAt}`);
console.log('\nOpen tabs should detect the update within ~1 minute.');
console.log('(Or immediately if you focus the tab or click "Check for update")');
