export class FrshlyError extends Error {
  constructor(
    message: string,
    public readonly code: FrshlyErrorCode,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'FrshlyError';
    Object.setPrototypeOf(this, FrshlyError.prototype);
  }
}

export type FrshlyErrorCode =
  | 'FETCH_TIMEOUT'
  | 'FETCH_FAILED'
  | 'NETWORK_ERROR'
  | 'INVALID_MANIFEST'
  | 'MISSING_VERSION'
  | 'STALE_AFTER_RELOAD'
  | 'UNKNOWN_ERROR';

export function createFrshlyError(
  code: FrshlyErrorCode,
  message: string,
  cause?: unknown
): FrshlyError {
  return new FrshlyError(message, code, cause);
}

export function isFrshlyError(error: unknown): error is FrshlyError {
  return error instanceof FrshlyError;
}
