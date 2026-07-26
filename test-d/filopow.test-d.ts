// tsd test for the per-chain subpath exports.
//
// `import type { FilopowConfig } from '@maximus-chain/multichain-lib/chains/filopow'`
// must narrow correctly. `FilopowChainLib` is the type returned by
// `create('filopow')`.

import type {
  FilopowConfig,
  FilopowChainLib,
} from '../typings/chains/filopow';
import type { ChainLib } from '../typings/chain';

// The Config is a structural superset of ChainConfig with a narrow `name`.
const _name: 'filopow' = ({} as FilopowConfig).name;

// The ChainLib is a structural ChainLib.
const _check: ChainLib = {} as FilopowChainLib;

// chainName on it is the literal type.
const _chainName: 'filopow' = ({} as FilopowChainLib).chainName;