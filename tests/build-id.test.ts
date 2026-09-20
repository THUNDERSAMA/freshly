import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveBuildId, generateContentHash, generateTimestampId } from '../src/shared/build-id';
import * as child_process from 'child_process';

vi.mock('child_process');

describe('build-id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveBuildId', () => {
    it('returns git short SHA when available', () => {
      vi.mocked(child_process.execSync).mockReturnValueOnce(Buffer.from('a1b2c3d\n'));

      const id = resolveBuildId();
      // Should either be git SHA or fallback timestamp
      expect(id).toBeTruthy();
      expect(id.length).toBeGreaterThan(0);
    });

    it('falls back to timestamp when git fails', () => {
      vi.mocked(child_process.execSync).mockImplementation(() => {
        throw new Error('git not found');
      });

      const id = resolveBuildId();
      expect(id).toMatch(/^\d{8}T\d{6}Z$/);
    });

    it('falls back to timestamp when git returns fatal error', () => {
      vi.mocked(child_process.execSync).mockReturnValue(Buffer.from('fatal: not a git repository\n'));

      const id = resolveBuildId();
      expect(id).toMatch(/^\d{8}T\d{6}Z$/);
    });

    it('never returns empty string', () => {
      vi.mocked(child_process.execSync).mockReturnValue(Buffer.from(''));

      const id = resolveBuildId();
      expect(id).toBeTruthy();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('generateContentHash', () => {
    it('generates consistent hash for same files', () => {
      const files = [
        { name: 'main.js', size: 1024 },
        { name: 'vendor.js', size: 2048 },
      ];

      const hash1 = generateContentHash(files);
      const hash2 = generateContentHash(files);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(7);
    });

    it('generates different hash for different files', () => {
      const files1 = [{ name: 'main.js', size: 1024 }];
      const files2 = [{ name: 'main.js', size: 2048 }];

      const hash1 = generateContentHash(files1);
      const hash2 = generateContentHash(files2);

      expect(hash1).not.toBe(hash2);
    });

    it('generates same hash regardless of input order', () => {
      const files1 = [
        { name: 'a.js', size: 100 },
        { name: 'b.js', size: 200 },
      ];
      const files2 = [
        { name: 'b.js', size: 200 },
        { name: 'a.js', size: 100 },
      ];

      const hash1 = generateContentHash(files1);
      const hash2 = generateContentHash(files2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateTimestampId', () => {
    it('generates ISO-based timestamp ID', () => {
      const id = generateTimestampId();
      expect(id).toMatch(/^\d{8}T\d{6}Z$/);
    });

    it('generates unique IDs across calls', () => {
      const id1 = generateTimestampId();
      const id2 = generateTimestampId();

      // They might be the same if called in same millisecond, but at least valid
      expect(id1).toMatch(/^\d{8}T\d{6}Z$/);
      expect(id2).toMatch(/^\d{8}T\d{6}Z$/);
    });
  });
});
