import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getReloadGuard,
  setReloadGuard,
  clearReloadGuard,
  checkReloadLoop,
  recordReloadAttempt,
} from '../src/runtime/reload';
import { STORAGE_KEY_RELOAD_GUARD } from '../src/shared/constants';

describe('reload-loop', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('getReloadGuard', () => {
    it('returns null when no guard exists', () => {
      const guard = getReloadGuard();
      expect(guard).toBeNull();
    });

    it('returns stored guard', () => {
      const record = { attemptedVersion: 'v2', attempts: 1, attemptedAt: Date.now() };
      sessionStorage.setItem(STORAGE_KEY_RELOAD_GUARD, JSON.stringify(record));

      const guard = getReloadGuard();
      expect(guard).toEqual(record);
    });

    it('returns null on parse error', () => {
      sessionStorage.setItem(STORAGE_KEY_RELOAD_GUARD, 'invalid json');

      const guard = getReloadGuard();
      expect(guard).toBeNull();
    });
  });

  describe('setReloadGuard', () => {
    it('persists guard record', () => {
      const record = { attemptedVersion: 'v2', attempts: 1, attemptedAt: Date.now() };
      setReloadGuard(record);

      const stored = sessionStorage.getItem(STORAGE_KEY_RELOAD_GUARD);
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(record);
    });
  });

  describe('clearReloadGuard', () => {
    it('removes guard record', () => {
      sessionStorage.setItem(STORAGE_KEY_RELOAD_GUARD, 'anything');

      clearReloadGuard();

      expect(sessionStorage.getItem(STORAGE_KEY_RELOAD_GUARD)).toBeNull();
    });
  });

  describe('checkReloadLoop', () => {
    it('allows reload when no prior attempt', () => {
      const result = checkReloadLoop('v1', 'v2', 1);

      expect(result.canReload).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('allows reload to different version', () => {
      setReloadGuard({ attemptedVersion: 'v2', attempts: 1, attemptedAt: Date.now() });

      const result = checkReloadLoop('v1', 'v3', 1);

      expect(result.canReload).toBe(true);
    });

    it('allows reload when current matches target', () => {
      setReloadGuard({ attemptedVersion: 'v2', attempts: 1, attemptedAt: Date.now() });

      const result = checkReloadLoop('v2', 'v2', 1);

      expect(result.canReload).toBe(true);
    });

    it('blocks reload when max attempts reached', () => {
      setReloadGuard({ attemptedVersion: 'v2', attempts: 1, attemptedAt: Date.now() });

      const result = checkReloadLoop('v1', 'v2', 1);

      expect(result.canReload).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('reload loop');
    });

    it('allows another attempt under limit', () => {
      setReloadGuard({ attemptedVersion: 'v2', attempts: 1, attemptedAt: Date.now() });

      const result = checkReloadLoop('v1', 'v2', 2);

      expect(result.canReload).toBe(true);
    });
  });

  describe('recordReloadAttempt', () => {
    it('records first attempt', () => {
      recordReloadAttempt('v2');

      const guard = getReloadGuard();
      expect(guard).toBeTruthy();
      expect(guard!.attemptedVersion).toBe('v2');
      expect(guard!.attempts).toBe(1);
    });

    it('increments attempts for same version', () => {
      recordReloadAttempt('v2');
      recordReloadAttempt('v2');

      const guard = getReloadGuard();
      expect(guard!.attempts).toBe(2);
    });

    it('resets attempts for different version', () => {
      recordReloadAttempt('v2');
      recordReloadAttempt('v3');

      const guard = getReloadGuard();
      expect(guard!.attemptedVersion).toBe('v3');
      expect(guard!.attempts).toBe(1);
    });
  });

  describe('integration: stale-after-reload scenario', () => {
    it('halts after max attempts', () => {
      // Simulate: bundle=v1, manifest=v2, reload → still v1
      recordReloadAttempt('v2');

      const check1 = checkReloadLoop('v1', 'v2', 1);
      expect(check1.canReload).toBe(false);
      expect(check1.error?.message).toContain('reload loop');
    });

    it('clears when finally successful', () => {
      recordReloadAttempt('v2');

      // Now we're on v2
      const check = checkReloadLoop('v2', 'v2', 1);
      expect(check.canReload).toBe(true);

      // Guard should be cleared (done by caller)
      clearReloadGuard();
      expect(getReloadGuard()).toBeNull();
    });
  });
});
