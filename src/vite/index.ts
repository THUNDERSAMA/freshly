import type { Plugin } from 'vite';
import { resolveBuildId, generateContentHash } from '../shared/build-id';
import type { VersionManifest } from '../shared/manifest';
import { FRSHLY_VERSION_VAR, FRSHLY_BUILT_AT_VAR } from '../shared/constants';

export interface FrshlyViteOptions {
  /**
   * URL where version.json will be served from.
   * Default: '/version.json'
   */
  versionUrl?: string;

  /**
   * Enable debug logging during build.
   */
  debug?: boolean;
}

export default function frshly(options: FrshlyViteOptions = {}): Plugin {
  const { debug = false } = options;
  let buildId: string | null = null;
  let builtAt: string | null = null;

  return {
    name: 'frshly',
    apply: 'build',

    config() {
      // Resolve build ID once
      if (!buildId) {
        buildId = resolveBuildId();
        builtAt = new Date().toISOString();

        if (debug) {
          console.log(`[frshly] Build ID: ${buildId}`);
        }
      }

      if (!buildId || !builtAt) {
        throw new Error(
          '[frshly] Failed to resolve build ID. This should never happen.'
        );
      }

      return {
        define: {
          [FRSHLY_VERSION_VAR]: JSON.stringify(buildId),
          [FRSHLY_BUILT_AT_VAR]: JSON.stringify(builtAt),
        },
      };
    },

    generateBundle(_options, bundle) {
      if (!buildId || !builtAt) {
        throw new Error(
          '[frshly] Build ID not resolved. Cannot emit version.json.'
        );
      }

      // Try to compute content hash from bundle
      const assets = Object.entries(bundle)
        .filter(([, chunk]) => chunk.type === 'chunk' || chunk.type === 'asset')
        .map(([name, chunk]) => ({
          name,
          size: 'code' in chunk ? chunk.code.length : chunk.source.toString().length,
        }));

      if (assets.length > 0) {
        const contentHash = generateContentHash(assets);
        if (debug) {
          console.log(`[frshly] Content hash: ${contentHash}`);
        }
        // Prefer content hash if git wasn't available
        if (!buildId.match(/^[a-f0-9]+$/i)) {
          buildId = contentHash;
        }
      }

      const manifest: VersionManifest = {
        version: buildId,
        builtAt: builtAt,
      };

      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(manifest, null, 2),
      });

      if (debug) {
        console.log(`[frshly] Emitted version.json with version: ${buildId}`);
      }
    },
  };
}
