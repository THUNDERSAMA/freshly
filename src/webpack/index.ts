import type { Compiler, WebpackPluginInstance } from 'webpack';
import { resolveBuildId, generateContentHash } from '../shared/build-id';
import type { VersionManifest } from '../shared/manifest';
import { FRSHLY_VERSION_VAR, FRSHLY_BUILT_AT_VAR } from '../shared/constants';

export interface FrshlyWebpackOptions {
  /**
   * Enable debug logging during build.
   */
  debug?: boolean;
}

export default class FrshlyWebpackPlugin implements WebpackPluginInstance {
  private options: FrshlyWebpackOptions;
  private buildId: string | null = null;
  private builtAt: string | null = null;

  constructor(options: FrshlyWebpackOptions = {}) {
    this.options = options;
  }

  apply(compiler: Compiler): void {
    const { debug = false } = this.options;

    // Resolve build ID once
    if (!this.buildId) {
      this.buildId = resolveBuildId();
      this.builtAt = new Date().toISOString();

      if (debug) {
        console.log(`[frshly] Build ID: ${this.buildId}`);
      }
    }

    if (!this.buildId || !this.builtAt) {
      throw new Error(
        '[frshly] Failed to resolve build ID. This should never happen.'
      );
    }

    const buildId = this.buildId;
    const builtAt = this.builtAt;

    // Inject constants via DefinePlugin
    const webpack = compiler.webpack;
    if (webpack && webpack.DefinePlugin) {
      new webpack.DefinePlugin({
        [FRSHLY_VERSION_VAR]: JSON.stringify(buildId),
        [FRSHLY_BUILT_AT_VAR]: JSON.stringify(builtAt),
      }).apply(compiler);
    }

    // Emit version.json
    compiler.hooks.thisCompilation.tap('FrshlyWebpackPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'FrshlyWebpackPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        (assets) => {
          // Try to compute content hash from emitted assets
          const assetList = Object.keys(assets).map((name) => ({
            name,
            size: assets[name]?.size() ?? 0,
          }));

          let finalBuildId = buildId;

          if (assetList.length > 0) {
            const contentHash = generateContentHash(assetList);
            if (debug) {
              console.log(`[frshly] Content hash: ${contentHash}`);
            }
            // Prefer content hash if git wasn't available
            if (!buildId.match(/^[a-f0-9]+$/i)) {
              finalBuildId = contentHash;
            }
          }

          const manifest: VersionManifest = {
            version: finalBuildId,
            builtAt: builtAt,
          };

          const manifestSource = JSON.stringify(manifest, null, 2);

          compilation.emitAsset(
            'version.json',
            new compiler.webpack.sources.RawSource(manifestSource)
          );

          if (debug) {
            console.log(`[frshly] Emitted version.json with version: ${finalBuildId}`);
          }
        }
      );
    });
  }
}
