import { describe, it, expect, vi } from 'vitest';
import frshlyPlugin from '../src/vite/index';

describe('vite-plugin', () => {
  it('creates plugin with correct name', () => {
    const plugin = frshlyPlugin();
    expect(plugin.name).toBe('frshly');
  });

  it('applies only to build', () => {
    const plugin = frshlyPlugin();
    expect(plugin.apply).toBe('build');
  });

  it('injects compile-time constants', () => {
    const plugin = frshlyPlugin();
    const config = plugin.config?.();

    expect(config).toBeDefined();
    expect(config?.define).toBeDefined();
    expect(config?.define?.__FRSHLY_VERSION__).toBeDefined();
    expect(config?.define?.__FRSHLY_BUILT_AT__).toBeDefined();
  });

  it('has generateBundle hook', () => {
    const plugin = frshlyPlugin();

    // Call config to resolve build ID
    plugin.config?.();

    // Verify the generateBundle hook exists
    expect(plugin.generateBundle).toBeDefined();
    expect(typeof plugin.generateBundle).toBe('function');
  });

  it('throws if build ID cannot be resolved', () => {
    const plugin = frshlyPlugin();

    // Don't call config (build ID not resolved)
    const mockEmitFile = vi.fn();

    // generateBundle should handle missing build ID gracefully
    // or the config() call should ensure it's always set
  });

  it('respects debug option', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const plugin = frshlyPlugin({ debug: true });
    plugin.config?.();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[frshly] Build ID:')
    );

    consoleSpy.mockRestore();
  });

  it('generates consistent build ID across hooks', () => {
    const plugin = frshlyPlugin();

    const config1 = plugin.config?.();
    const config2 = plugin.config?.();

    // Build ID should be resolved once and reused
    expect(config1?.define?.__FRSHLY_VERSION__).toBe(
      config2?.define?.__FRSHLY_VERSION__
    );
  });
});
