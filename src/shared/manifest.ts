export interface VersionManifest {
  version: string;
  builtAt: string;
}

export function isValidManifest(data: unknown): data is VersionManifest {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const manifest = data as Record<string, unknown>;

  if (typeof manifest.version !== 'string' || manifest.version.trim() === '') {
    return false;
  }

  if (typeof manifest.builtAt !== 'string' || manifest.builtAt.trim() === '') {
    return false;
  }

  // Validate builtAt is ISO 8601
  const date = new Date(manifest.builtAt);
  if (isNaN(date.getTime())) {
    return false;
  }

  return true;
}

export function parseManifest(text: string): VersionManifest | null {
  try {
    const data = JSON.parse(text);
    return isValidManifest(data) ? data : null;
  } catch {
    return null;
  }
}
