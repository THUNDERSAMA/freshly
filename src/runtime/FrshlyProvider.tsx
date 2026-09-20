import React, { createContext, useEffect, useRef, useState, useCallback } from 'react';
import type { FrshlyOptions, FrshlyState, FrshlyStatus } from './types';
import {
  DEFAULT_VERSION_URL,
  DEFAULT_POLL_INTERVAL,
  DEFAULT_FETCH_TIMEOUT,
  DEFAULT_CONSECUTIVE_MISMATCHES,
  DEFAULT_MAX_RELOAD_ATTEMPTS,
} from '../shared/constants';
import { FrshlyEngine } from './engine';
import { clearReloadGuard } from './reload';

declare const __FRSHLY_VERSION__: string;
declare const __FRSHLY_BUILT_AT__: string;

export const FrshlyContext = createContext<FrshlyState | null>(null);

export interface FrshlyProviderProps extends FrshlyOptions {
  children: React.ReactNode;
}

export function FrshlyProvider({
  children,
  mode = 'auto',
  versionUrl = DEFAULT_VERSION_URL,
  pollInterval = DEFAULT_POLL_INTERVAL,
  checkOnFocus = true,
  checkOnVisibilityChange = true,
  checkOnOnline = true,
  checkOnRouteChange = false,
  routeKey,
  requireConsecutiveMismatches = DEFAULT_CONSECUTIVE_MISMATCHES,
  fetchTimeout = DEFAULT_FETCH_TIMEOUT,
  maxReloadAttempts = DEFAULT_MAX_RELOAD_ATTEMPTS,
  debug = false,
  shouldReload,
  onCheck,
  onUpdateDetected,
  onReload,
  onError,
}: FrshlyProviderProps) {
  const currentVersion =
    typeof __FRSHLY_VERSION__ !== 'undefined' ? __FRSHLY_VERSION__ : 'unknown';
  const builtAt =
    typeof __FRSHLY_BUILT_AT__ !== 'undefined' ? __FRSHLY_BUILT_AT__ : null;

  const [status, setStatus] = useState<FrshlyStatus>('idle');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const engineRef = useRef<FrshlyEngine | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Initialize engine once
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new FrshlyEngine(currentVersion, {
        versionUrl,
        fetchTimeout,
        requireConsecutiveMismatches,
        maxReloadAttempts,
        mode,
        debug,
        shouldReload,
        onCheck: (result) => {
          if (!mountedRef.current) return;
          setLastCheckedAt(Date.now());
          onCheck?.(result);
        },
        onUpdateDetected: (version) => {
          if (!mountedRef.current) return;
          setLatestVersion(version);
          setUpdateAvailable(true);
          setStatus('update-available');
          onUpdateDetected?.(version);
        },
        onReload: (version) => {
          if (!mountedRef.current) return;
          setStatus('reloading');
          onReload?.(version);
        },
        onError: (error) => {
          if (!mountedRef.current) return;
          setStatus('error');
          onError?.(error);
        },
      });

      // Clear reload guard if we successfully loaded the latest version
      const state = engineRef.current.getState();
      if (state.confirmedVersion && state.confirmedVersion === currentVersion) {
        clearReloadGuard();
      }
    }

    return () => {
      mountedRef.current = false;
      engineRef.current?.destroy();
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []); // Only run once

  // Check function
  const check = useCallback(async () => {
    if (!engineRef.current) return;
    setStatus('checking');
    await engineRef.current.check();
    setStatus(updateAvailable ? 'update-available' : 'current');
  }, [updateAvailable]);

  // Reload function
  const reload = useCallback(() => {
    if (!engineRef.current || !latestVersion) return;
    engineRef.current.reload(latestVersion);
  }, [latestVersion]);

  // Dismiss function (for prompt mode)
  const dismiss = useCallback(() => {
    setUpdateAvailable(false);
    setStatus('current');
  }, []);

  // Setup polling
  useEffect(() => {
    if (pollInterval > 0) {
      pollTimerRef.current = window.setInterval(() => {
        check();
      }, pollInterval);

      // Initial check
      check();

      return () => {
        if (pollTimerRef.current !== null) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      };
    }
  }, [pollInterval, check]);

  // Focus listener
  useEffect(() => {
    if (!checkOnFocus) return;

    const handleFocus = () => {
      check();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkOnFocus, check]);

  // Visibility change listener
  useEffect(() => {
    if (!checkOnVisibilityChange) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkOnVisibilityChange, check]);

  // Online listener
  useEffect(() => {
    if (!checkOnOnline) return;

    const handleOnline = () => {
      check();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [checkOnOnline, check]);

  // Route change listener
  useEffect(() => {
    if (!checkOnRouteChange) return;

    // Trigger check when routeKey changes
    check();
  }, [routeKey, checkOnRouteChange, check]);

  const value: FrshlyState = {
    updateAvailable,
    currentVersion,
    latestVersion,
    builtAt,
    status,
    lastCheckedAt,
    check,
    reload,
    dismiss,
  };

  return <FrshlyContext.Provider value={value}>{children}</FrshlyContext.Provider>;
}
