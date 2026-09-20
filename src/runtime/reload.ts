import type { ReloadGuardRecord } from './types';
import { STORAGE_KEY_RELOAD_GUARD } from '../shared/constants';
import { createFrshlyError } from './errors';

export function getReloadGuard(): ReloadGuardRecord | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY_RELOAD_GUARD);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as ReloadGuardRecord;
    return parsed;
  } catch {
    return null;
  }
}

export function setReloadGuard(record: ReloadGuardRecord): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_RELOAD_GUARD, JSON.stringify(record));
  } catch {
    // Silently fail if sessionStorage is unavailable
  }
}

export function clearReloadGuard(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_RELOAD_GUARD);
  } catch {
    // Silently fail
  }
}

export function checkReloadLoop(
  currentVersion: string,
  targetVersion: string,
  maxAttempts: number
): { canReload: boolean; error?: Error } {
  const guard = getReloadGuard();

  // No prior attempt, safe to reload
  if (!guard) {
    return { canReload: true };
  }

  // Different target version, reset and allow
  if (guard.attemptedVersion !== targetVersion) {
    clearReloadGuard();
    return { canReload: true };
  }

  // Same target, but we successfully loaded it
  if (currentVersion === targetVersion) {
    clearReloadGuard();
    return { canReload: true };
  }

  // Same target, still on old version
  if (guard.attempts >= maxAttempts) {
    return {
      canReload: false,
      error: createFrshlyError(
        'STALE_AFTER_RELOAD',
        `Attempted to reload to ${targetVersion} ${guard.attempts} time(s), but still running ${currentVersion}. Halting to prevent reload loop.`
      ),
    };
  }

  // Same target, under limit, allow another attempt
  return { canReload: true };
}

export function recordReloadAttempt(version: string): void {
  const existing = getReloadGuard();

  if (existing && existing.attemptedVersion === version) {
    setReloadGuard({
      attemptedVersion: version,
      attempts: existing.attempts + 1,
      attemptedAt: Date.now(),
    });
  } else {
    setReloadGuard({
      attemptedVersion: version,
      attempts: 1,
      attemptedAt: Date.now(),
    });
  }
}

export function performReload(): void {
  window.location.reload();
}
