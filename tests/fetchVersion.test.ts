import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchVersion } from '../src/runtime/fetchVersion';

describe('fetchVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully fetches valid manifest', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        version: 'abc123',
        builtAt: '2026-09-20T10:00:00.000Z',
      }),
    });

    const result = await fetchVersion({ url: '/version.json' });

    expect(result.success).toBe(true);
    expect(result.manifest).toEqual({
      version: 'abc123',
      builtAt: '2026-09-20T10:00:00.000Z',
    });
    expect(result.error).toBeUndefined();
  });

  it('handles 404 error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await fetchVersion({ url: '/version.json' });

    expect(result.success).toBe(false);
    expect(result.manifest).toBeNull();
    expect(result.error?.message).toContain('404');
  });

  it('handles 500 error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await fetchVersion({ url: '/version.json' });

    expect(result.success).toBe(false);
    expect(result.manifest).toBeNull();
    expect(result.error?.message).toContain('500');
  });

  it('handles network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchVersion({ url: '/version.json' });

    expect(result.success).toBe(false);
    expect(result.manifest).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('handles timeout', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise((resolve) => setTimeout(resolve, 10000))
    );

    const result = await fetchVersion({ url: '/version.json', timeout: 100 });

    expect(result.success).toBe(false);
    expect(result.manifest).toBeNull();
    expect(result.error).toBeDefined();
    // Error message could be either "timed out" or "Network error"
    expect(result.error?.message).toBeTruthy();
  }, 10000);

  it('handles invalid JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'not json',
    });

    const result = await fetchVersion({ url: '/version.json' });

    expect(result.success).toBe(false);
    expect(result.manifest).toBeNull();
    expect(result.error?.message).toContain('Invalid');
  });

  it('handles missing version field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ builtAt: '2026-09-20T10:00:00.000Z' }),
    });

    const result = await fetchVersion({ url: '/version.json' });

    expect(result.success).toBe(false);
    expect(result.manifest).toBeNull();
  });

  it('handles empty version', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ version: '', builtAt: '2026-09-20T10:00:00.000Z' }),
    });

    const result = await fetchVersion({ url: '/version.json' });

    expect(result.success).toBe(false);
    expect(result.manifest).toBeNull();
  });

  it('includes sequence number in result', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ version: 'v1', builtAt: '2026-09-20T10:00:00.000Z' }),
    });

    const result = await fetchVersion({ url: '/version.json', sequenceNumber: 42 });

    expect(result.sequenceNumber).toBe(42);
  });

  it('adds cache-busting query parameter', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ version: 'v1', builtAt: '2026-09-20T10:00:00.000Z' }),
    });
    global.fetch = mockFetch;

    await fetchVersion({ url: '/version.json' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/version\.json\?frshly=\d+/),
      expect.any(Object)
    );
  });

  it('uses no-store cache directive', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ version: 'v1', builtAt: '2026-09-20T10:00:00.000Z' }),
    });
    global.fetch = mockFetch;

    await fetchVersion({ url: '/version.json' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        cache: 'no-store',
      })
    );
  });
});
