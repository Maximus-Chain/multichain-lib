import { ChainLib, ChainConfig } from '../chain';

/**
 * The MaximusChain built-in configuration. Importable as a value
 * (for `registerChain('maximus', maximusConfig)`) and as a type (for
 * narrowing `create('maximus')` returns to `MaximusChainLib`).
 */
export interface MaximusConfig extends ChainConfig {
  name: 'maximus';
}

export type MaximusChainLib = ChainLib<MaximusConfig>;