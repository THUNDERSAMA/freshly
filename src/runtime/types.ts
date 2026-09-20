export type FrshlyMode = 'auto' | 'prompt' | 'manual';

export type FrshlyStatus =
  | 'idle'
  | 'checking'
  | 'current'
  | 'mismatch'
  | 'update-available'
  | 'reloading'
  | 'error';

export interface CheckResult {
  success: boolean;
  currentVersion: string;
  latestVersion: string | null;
  isUpToDate: boolean;
  error?: Error;
}

export interface FrshlyOptions {
  mode?: FrshlyMode;
  versionUrl?: string;
  pollInterval?: number;
  checkOnFocus?: boolean;
  checkOnVisibilityChange?: boolean;
  checkOnOnline?: boolean;
  checkOnRouteChange?: boolean;
  routeKey?: string;
  requireConsecutiveMismatches?: number;
  fetchTimeout?: number;
  maxReloadAttempts?: number;
  debug?: boolean;
  shouldReload?: () => boolean | Promise<boolean>;
  onCheck?: (result: CheckResult) => void;
  onUpdateDetected?: (version: string) => void;
  onReload?: (version: string) => void;
  onError?: (error: Error) => void;
}

export interface FrshlyState {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string | null;
  builtAt: string | null;
  status: FrshlyStatus;
  lastCheckedAt: number | null;
  check: () => Promise<void>;
  reload: () => void;
  dismiss: () => void;
}

export interface DetectionState {
  currentVersion: string;
  candidateVersion: string | null;
  consecutiveMatches: number;
  confirmedVersion: string | null;
}

export interface ReloadGuardRecord {
  attemptedVersion: string;
  attempts: number;
  attemptedAt: number;
}
