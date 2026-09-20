import FrshlyWebpackPlugin, { type FrshlyWebpackOptions } from '../webpack';

export interface FrshlyCracoOptions extends FrshlyWebpackOptions {}

/**
 * Craco plugin adapter for frshly.
 * Reuses the Webpack plugin implementation.
 *
 * Usage:
 * ```js
 * // craco.config.js
 * const { frshly } = require('frshly/craco');
 *
 * module.exports = {
 *   webpack: {
 *     plugins: {
 *       add: [frshly()]
 *     }
 *   }
 * };
 * ```
 */
export function frshly(options: FrshlyCracoOptions = {}): FrshlyWebpackPlugin {
  return new FrshlyWebpackPlugin(options);
}

export default frshly;
