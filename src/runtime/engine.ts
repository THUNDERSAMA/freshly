import type { FrshlyOptions, CheckResult, DetectionState } from './types';
import { LOG_PREFIX } from '../shared/constants';
import { fetchVersion } from './fetchVersion';
import { transition, createInitialState } from './state-machine';
import { checkReloadLoop, recordReloadAttempt, performReload } from './reload';
import { BroadcastCoordinator } from './broadcast';

export class FrshlyEngine {
  private state: DetectionState;
  private sequenceNumber = 0;
  private checkInProgress = false;
  private broadcast: BroadcastCoordinator;

  constructor(
    private currentVersion: string,
    private options: Required<
      Pick<
        FrshlyOptions,
        | 'versionUrl'
        | 'fetchTimeout'
        | 'requireConsecutiveMismatches'
        | 'maxReloadAttempts'
        | 'mode'
        | 'debug'
      >
    > & {
      shouldReload?: FrshlyOptions['shouldReload'];
      onCheck?: FrshlyOptions['onCheck'];
      onUpdateDetected?: FrshlyOptions['onUpdateDetected'];
      onReload?: FrshlyOptions['onReload'];
      onError?: FrshlyOptions['onError'];
    }
  ) {
    this.state = createInitialState(currentVersion);
    this.broadcast = new BroadcastCoordinator();

    // Listen for updates from other tabs
    this.broadcast.subscribe((message) => {
      this.handleBroadcastUpdate(message.version);
    });
  }

  public async check(): Promise<CheckResult> {
    if (this.checkInProgress) {
      this.log('Check already in progress, skipping');
      return {
        success: false,
        currentVersion: this.currentVersion,
        latestVersion: this.state.confirmedVersion,
        isUpToDate: true,
      };
    }

    this.checkInProgress = true;
    this.sequenceNumber++;
    const currentSeq = this.sequenceNumber;

    try {
      this.log('Checking for updates...');

      const result = await fetchVersion({
        url: this.options.versionUrl,
        timeout: this.options.fetchTimeout,
        sequenceNumber: currentSeq,
      });

      // Discard if stale (a newer check completed)
      if (result.sequenceNumber < this.sequenceNumber) {
        this.log('Discarding stale check result');
        return {
          success: false,
          currentVersion: this.currentVersion,
          latestVersion: this.state.confirmedVersion,
          isUpToDate: true,
        };
      }

      const outcome = result.success
        ? { type: 'success' as const, version: result.manifest!.version }
        : { type: 'failure' as const };

      const transitionResult = transition(
        this.state,
        outcome,
        this.options.requireConsecutiveMismatches
      );

      this.state = transitionResult.state;

      const checkResult: CheckResult = {
        success: result.success,
        currentVersion: this.currentVersion,
        latestVersion: result.manifest?.version ?? null,
        isUpToDate: !transitionResult.confirmed,
        error: result.error,
      };

      this.log(
        `Check complete: current=${this.currentVersion} candidate=${this.state.candidateVersion} matches=${this.state.consecutiveMatches} confirmed=${transitionResult.confirmed}`
      );

      this.options.onCheck?.(checkResult);

      if (transitionResult.confirmed && this.state.confirmedVersion) {
        this.handleUpdateConfirmed(this.state.confirmedVersion);
      }

      if (result.error) {
        this.options.onError?.(result.error);
      }

      return checkResult;
    } finally {
      this.checkInProgress = false;
    }
  }

  private handleUpdateConfirmed(version: string): void {
    this.log(`Update confirmed: ${version}`);
    this.options.onUpdateDetected?.(version);
    this.broadcast.broadcast(version);

    if (this.options.mode === 'auto') {
      this.triggerAutoReload(version);
    }
  }

  private handleBroadcastUpdate(version: string): void {
    // Another tab confirmed an update
    if (version !== this.currentVersion && version !== this.state.confirmedVersion) {
      this.log(`Update detected from another tab: ${version}`);
      this.state.confirmedVersion = version;
      this.options.onUpdateDetected?.(version);

      if (this.options.mode === 'auto') {
        this.triggerAutoReload(version);
      }
    }
  }

  private async triggerAutoReload(version: string): Promise<void> {
    // Check loop guard
    const { canReload, error } = checkReloadLoop(
      this.currentVersion,
      version,
      this.options.maxReloadAttempts
    );

    if (!canReload) {
      this.log('Reload blocked by loop guard');
      if (error) {
        this.options.onError?.(error);
      }
      return;
    }

    // Check shouldReload gate
    if (this.options.shouldReload) {
      try {
        const allowed = await this.options.shouldReload();
        if (!allowed) {
          this.log('Reload blocked by shouldReload');
          return;
        }
      } catch (error) {
        this.log('shouldReload threw, blocking reload');
        this.options.onError?.(error as Error);
        return;
      }
    }

    this.reload(version);
  }

  public reload(version: string): void {
    this.log(`Reloading to ${version}`);
    recordReloadAttempt(version);
    this.options.onReload?.(version);
    performReload();
  }

  public getState(): DetectionState {
    return this.state;
  }

  public destroy(): void {
    this.broadcast.destroy();
  }

  private log(message: string): void {
    if (this.options.debug) {
      console.log(`${LOG_PREFIX} ${message}`);
    }
  }
}
