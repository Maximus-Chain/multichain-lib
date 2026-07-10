// v3 root API surface.
//
// What changed vs v2:
//   - The library is now strictly chain-isolated. There is no top-level
//     `Address`, `Transaction`, `PrivateKey`, etc. Those classes live
//     inside the object returned by `create(name)`.
//   - This file declares only the root API: `create`, `chains`,
//     `registerChain`, `createHashRegistry`, `version`. Plus the
//     default export (the namespace as a whole, for legacy consumers).
//   - Each built-in chain has its own `.d.ts` under `./typings/chains/`
//     so TypeScript can narrow `create('maximus')` to `MaximusChainLib`
//     and give consumers chain-specific autocomplete.

import { ChainLib, ChainConfig } from './typings/chain';
import { MaximusChainLib } from './typings/chains/maximus';
import { OsmiumChainLib } from './typings/chains/osmium';

/** Library version, e.g. `"v3.0.0"`. */
export const version: string;

/** Names of all currently-registered (built-in + custom) chains. */
export function chains(): string[];

/**
 * Register a custom chain. The config must include both `livenet` and
 * `testnet` Network parameters. Hash algorithms registered under
 * `config.algorithms` are isolated to that chain and don't leak.
 */
export function registerChain(name: string, config: ChainConfig): void;

/**
 * Create a stand-alone hash-algorithm registry, independent of any
 * chain. Useful when you need to compute hashes outside of a `create()`d
 * ChainLib (e.g. for low-level crypto code).
 */
export function createHashRegistry(): import('./typings/chain').HashRegistry;

/**
 * Returns a fully-isolated `ChainLib` bound to `name`. Each call
 * returns a fresh instance — even for the same chain name — with its
 * own `Networks`, hash registry, and class closures.
 *
 * TypeScript overloads narrow the return type for built-in chains:
 *   `create('maximus')` → `MaximusChainLib`
 *   `create('osmium')`  → `OsmiumChainLib`
 *   `create('mycoin')`  → `ChainLib` (generic)
 */
export function create(name: 'maximus'): MaximusChainLib;
export function create(name: 'osmium'): OsmiumChainLib;
export function create(name: string): ChainLib;

/**
 * Default export — the whole root namespace as a single object.
 * Useful for `import multichain from '@maximus-chain/multichain-lib'`.
 */
declare const _default: {
  version: string;
  create: typeof create;
  chains: typeof chains;
  registerChain: typeof registerChain;
  createHashRegistry: typeof createHashRegistry;
};
export default _default;