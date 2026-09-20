import { BROADCAST_CHANNEL_NAME } from '../shared/constants';

export interface BroadcastMessage {
  type: 'version-confirmed';
  version: string;
  timestamp: number;
}

export type BroadcastListener = (message: BroadcastMessage) => void;

export class BroadcastCoordinator {
  private channel: BroadcastChannel | null = null;
  private listeners = new Set<BroadcastListener>();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.addEventListener('message', this.handleMessage);
      } catch {
        // BroadcastChannel not available or blocked
        this.channel = null;
      }
    }
  }

  private handleMessage = (event: MessageEvent): void => {
    try {
      const message = event.data as BroadcastMessage;
      if (message.type === 'version-confirmed') {
        this.listeners.forEach((listener) => listener(message));
      }
    } catch {
      // Ignore invalid messages
    }
  };

  public broadcast(version: string): void {
    if (!this.channel) return;

    try {
      const message: BroadcastMessage = {
        type: 'version-confirmed',
        version,
        timestamp: Date.now(),
      };
      this.channel.postMessage(message);
    } catch {
      // Silently fail
    }
  }

  public subscribe(listener: BroadcastListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy(): void {
    if (this.channel) {
      this.channel.removeEventListener('message', this.handleMessage);
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}
