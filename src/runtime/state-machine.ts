import type { DetectionState } from './types';

export type FetchOutcome =
  | { type: 'success'; version: string }
  | { type: 'failure' };

export interface TransitionResult {
  state: DetectionState;
  confirmed: boolean;
}

/**
 * Pure state machine for version detection.
 *
 * Rules:
 * - CURRENT → same version → CURRENT
 * - CURRENT → different X → MISMATCH(X, 1)
 * - MISMATCH(X, n) → X → MISMATCH(X, n+1) | CONFIRMED when n+1 >= threshold
 * - MISMATCH(X, n) → current version → CURRENT (reset)
 * - MISMATCH(X, n) → different Y → MISMATCH(Y, 1) (reset counter, new candidate)
 * - ANY → failure → UNKNOWN (no state change)
 */
export function transition(
  state: DetectionState,
  outcome: FetchOutcome,
  threshold: number
): TransitionResult {
  // Failure: no state change
  if (outcome.type === 'failure') {
    return { state, confirmed: false };
  }

  const { version: fetchedVersion } = outcome;
  const { currentVersion, candidateVersion, consecutiveMatches } = state;

  // If fetched version matches current, we're up to date
  if (fetchedVersion === currentVersion) {
    return {
      state: {
        currentVersion,
        candidateVersion: null,
        consecutiveMatches: 0,
        confirmedVersion: null,
      },
      confirmed: false,
    };
  }

  // If there's no candidate yet, this is the first mismatch
  if (candidateVersion === null) {
    return {
      state: {
        currentVersion,
        candidateVersion: fetchedVersion,
        consecutiveMatches: 1,
        confirmedVersion: null,
      },
      confirmed: false,
    };
  }

  // If fetched version matches the candidate, increment counter
  if (fetchedVersion === candidateVersion) {
    const newCount = consecutiveMatches + 1;
    const isConfirmed = newCount >= threshold;

    return {
      state: {
        currentVersion,
        candidateVersion: fetchedVersion,
        consecutiveMatches: newCount,
        confirmedVersion: isConfirmed ? fetchedVersion : null,
      },
      confirmed: isConfirmed,
    };
  }

  // Fetched version is different from both current and candidate: new candidate
  return {
    state: {
      currentVersion,
      candidateVersion: fetchedVersion,
      consecutiveMatches: 1,
      confirmedVersion: null,
    },
    confirmed: false,
  };
}

export function createInitialState(currentVersion: string): DetectionState {
  return {
    currentVersion,
    candidateVersion: null,
    consecutiveMatches: 0,
    confirmedVersion: null,
  };
}
