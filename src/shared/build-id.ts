import { execSync } from 'child_process';
import { createHash } from 'crypto';

export function resolveBuildId(): string {
  // 1. Try git
  const gitId = tryGit();
  if (gitId) return gitId;

  // 2. Try content hash (requires bundle info, not available at build-id resolution time)
  // This is implemented in the bundler plugins which have access to emitted assets

  // 3. Fallback to timestamp
  return generateTimestampId();
}

function tryGit(): string | null {
  try {
    const sha = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'], // suppress stderr
      timeout: 2000,
    }).trim();

    if (sha && sha.length > 0 && !sha.includes('fatal')) {
      return sha;
    }
    return null;
  } catch {
    return null;
  }
}

export function generateContentHash(files: Array<{ name: string; size: number }>): string {
  const hash = createHash('sha256');

  // Sort for determinism
  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));

  for (const file of sorted) {
    hash.update(`${file.name}:${file.size}`);
  }

  return hash.digest('hex').substring(0, 7);
}

export function generateTimestampId(): string {
  // Format: YYYYMMDDTHHmmssZ (16 chars total)
  const iso = new Date().toISOString();
  // Extract: YYYY-MM-DDTHH:mm:ss.sssZ
  const parts = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!parts) {
    return iso.replace(/[-:.]/g, '').substring(0, 16);
  }
  return `${parts[1]}${parts[2]}${parts[3]}T${parts[4]}${parts[5]}${parts[6]}Z`;
}
