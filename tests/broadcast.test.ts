import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BroadcastCoordinator } from '../src/runtime/broadcast';

describe('broadcast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates coordinator without errors', () => {
    const coordinator = new BroadcastCoordinator();
    expect(coordinator).toBeDefined();
    coordinator.destroy();
  });

  it('broadcasts version updates', () => {
    const coordinator = new BroadcastCoordinator();

    // Should not throw
    coordinator.broadcast('v2');

    coordinator.destroy();
  });

  it('subscribes and receives messages', (done) => {
    const coordinator1 = new BroadcastCoordinator();
    const coordinator2 = new BroadcastCoordinator();

    const listener = vi.fn((message) => {
      expect(message.version).toBe('v3');
      expect(message.type).toBe('version-confirmed');
      coordinator1.destroy();
      coordinator2.destroy();
      done();
    });

    coordinator2.subscribe(listener);
    coordinator1.broadcast('v3');
  });

  it('unsubscribes correctly', () => {
    const coordinator = new BroadcastCoordinator();
    const listener = vi.fn();

    const unsubscribe = coordinator.subscribe(listener);
    unsubscribe();

    coordinator.broadcast('v4');

    // Give time for message to propagate (if it would)
    setTimeout(() => {
      expect(listener).not.toHaveBeenCalled();
      coordinator.destroy();
    }, 100);
  });

  it('handles missing BroadcastChannel gracefully', () => {
    const originalBC = (global as any).BroadcastChannel;
    (global as any).BroadcastChannel = undefined;

    const coordinator = new BroadcastCoordinator();

    // Should not throw
    coordinator.broadcast('v5');

    const listener = vi.fn();
    coordinator.subscribe(listener);

    coordinator.destroy();

    (global as any).BroadcastChannel = originalBC;
  });

  it('cleans up on destroy', () => {
    const coordinator = new BroadcastCoordinator();
    const listener = vi.fn();

    coordinator.subscribe(listener);
    coordinator.destroy();

    // After destroy, should not receive messages
    coordinator.broadcast('v6');

    setTimeout(() => {
      expect(listener).not.toHaveBeenCalled();
    }, 100);
  });
});
