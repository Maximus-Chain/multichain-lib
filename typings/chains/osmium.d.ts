import { ChainLib, ChainConfig } from '../chain';

/**
 * The Osmium built-in configuration.
 */
export interface OsmiumConfig extends ChainConfig {
  name: 'osmium';
}

export type OsmiumChainLib = ChainLib<OsmiumConfig>;