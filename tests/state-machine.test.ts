import { describe, it, expect } from 'vitest';
import { transition, createInitialState } from '../src/runtime/state-machine';
import type { FetchOutcome } from '../src/runtime/state-machine';

describe('state-machine', () => {
  const threshold = 2;

  describe('createInitialState', () => {
    it('creates clean initial state', () => {
      const state = createInitialState('v1');
      expect(state).toEqual({
        currentVersion: 'v1',
        candidateVersion: null,
        consecutiveMatches: 0,
        confirmedVersion: null,
      });
    });
  });

  describe('transition', () => {
    it('A→A remains CURRENT', () => {
      const state = createInitialState('A');
      const outcome: FetchOutcome = { type: 'success', version: 'A' };

      const result = transition(state, outcome, threshold);

      expect(result.state.currentVersion).toBe('A');
      expect(result.state.candidateVersion).toBeNull();
      expect(result.state.consecutiveMatches).toBe(0);
      expect(result.confirmed).toBe(false);
    });

    it('A→B creates mismatch with count 1', () => {
      const state = createInitialState('A');
      const outcome: FetchOutcome = { type: 'success', version: 'B' };

      const result = transition(state, outcome, threshold);

      expect(result.state.candidateVersion).toBe('B');
      expect(result.state.consecutiveMatches).toBe(1);
      expect(result.confirmed).toBe(false);
    });

    it('A→B→B confirms after threshold', () => {
      let state = createInitialState('A');

      // First B
      state = transition(state, { type: 'success', version: 'B' }, threshold).state;
      expect(state.consecutiveMatches).toBe(1);

      // Second B (reaches threshold)
      const result = transition(state, { type: 'success', version: 'B' }, threshold);
      expect(result.state.consecutiveMatches).toBe(2);
      expect(result.state.confirmedVersion).toBe('B');
      expect(result.confirmed).toBe(true);
    });

    it('A→B→A resets to CURRENT', () => {
      let state = createInitialState('A');

      // A→B
      state = transition(state, { type: 'success', version: 'B' }, threshold).state;
      expect(state.candidateVersion).toBe('B');

      // B→A (back to current)
      const result = transition(state, { type: 'success', version: 'A' }, threshold);
      expect(result.state.candidateVersion).toBeNull();
      expect(result.state.consecutiveMatches).toBe(0);
      expect(result.confirmed).toBe(false);
    });

    it('A→B→C resets counter (new candidate)', () => {
      let state = createInitialState('A');

      // A→B
      state = transition(state, { type: 'success', version: 'B' }, threshold).state;
      expect(state.candidateVersion).toBe('B');
      expect(state.consecutiveMatches).toBe(1);

      // B→C (different candidate)
      const result = transition(state, { type: 'success', version: 'C' }, threshold);
      expect(result.state.candidateVersion).toBe('C');
      expect(result.state.consecutiveMatches).toBe(1);
      expect(result.confirmed).toBe(false);
    });

    it('failure leaves state unchanged', () => {
      const state = createInitialState('A');
      const outcome: FetchOutcome = { type: 'failure' };

      const result = transition(state, outcome, threshold);

      expect(result.state).toEqual(state);
      expect(result.confirmed).toBe(false);
    });

    it('A→B→failure→B still counts', () => {
      let state = createInitialState('A');

      // A→B
      state = transition(state, { type: 'success', version: 'B' }, threshold).state;
      expect(state.consecutiveMatches).toBe(1);

      // Failure (no change)
      state = transition(state, { type: 'failure' }, threshold).state;
      expect(state.consecutiveMatches).toBe(1);

      // B again
      const result = transition(state, { type: 'success', version: 'B' }, threshold);
      expect(result.state.consecutiveMatches).toBe(2);
      expect(result.confirmed).toBe(true);
    });

    it('configurable threshold works', () => {
      let state = createInitialState('A');
      const customThreshold = 3;

      state = transition(state, { type: 'success', version: 'B' }, customThreshold).state;
      expect(state.consecutiveMatches).toBe(1);

      state = transition(state, { type: 'success', version: 'B' }, customThreshold).state;
      expect(state.consecutiveMatches).toBe(2);

      const result = transition(state, { type: 'success', version: 'B' }, customThreshold);
      expect(result.state.consecutiveMatches).toBe(3);
      expect(result.confirmed).toBe(true);
    });
  });
});
