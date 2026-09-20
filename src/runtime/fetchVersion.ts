import type { VersionManifest } from '../shared/manifest';
import { parseManifest } from '../shared/manifest';
import { DEFAULT_FETCH_TIMEOUT } from '../shared/constants';
import { createFrshlyError } from './errors';

export interface FetchVersionOptions {
  url: string;
  timeout?: number;
  signal?: AbortSignal;
  sequenceNumber?: number;
}

export interface FetchVersionResult {
  success: boolean;
  manifest: VersionManifest | null;
  error?: Error;
  sequenceNumber: number;
}

/**
 * Fetch version.json with timeout, cache-busting, and defensive validation.
 */
export async function fetchVersion(
  options: FetchVersionOptions
): Promise<FetchVersionResult> {
  const {
    url,
    timeout = DEFAULT_FETCH_TIMEOUT,
    signal,
    sequenceNumber = 0,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // Combine external signal with timeout
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    // Cache-bust with timestamp
    const cacheBustUrl = `${url}?frshly=${Date.now()}`;

    const response = await fetch(cacheBustUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        manifest: null,
        error: createFrshlyError(
          'FETCH_FAILED',
          `Failed to fetch version: ${response.status} ${response.statusText}`
        ),
        sequenceNumber,
      };
    }

    const text = await response.text();
    const manifest = parseManifest(text);

    if (!manifest) {
      return {
        success: false,
        manifest: null,
        error: createFrshlyError(
          'INVALID_MANIFEST',
          'Invalid version manifest format'
        ),
        sequenceNumber,
      };
    }

    return {
      success: true,
      manifest,
      error: undefined,
      sequenceNumber,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    const isTimeout =
      error instanceof Error && error.name === 'AbortError';

    return {
      success: false,
      manifest: null,
      error: createFrshlyError(
        isTimeout ? 'FETCH_TIMEOUT' : 'NETWORK_ERROR',
        isTimeout
          ? `Fetch timed out after ${timeout}ms`
          : 'Network error while fetching version',
        error
      ),
      sequenceNumber,
    };
  }
}
