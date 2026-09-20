import { describe, it, expect } from 'vitest';
import { useFrshly } from '../src/runtime/useFrshly';

// Mock the global constants
(globalThis as any).__FRSHLY_VERSION__ = 'test-version';
(globalThis as any).__FRSHLY_BUILT_AT__ = '2026-09-20T10:00:00.000Z';

describe('useFrshly', () => {
  it('exports useFrshly hook', () => {
    expect(useFrshly).toBeDefined();
    expect(typeof useFrshly).toBe('function');
  });

  it('throws when used outside provider', () => {
    // Without a provider, the hook should throw
    expect(() => {
      useFrshly();
    }).toThrow();
  });
});
