// tsd test for the per-chain subpath exports.
//
// `import type { KerriganConfig } from '@maximus-chain/multichain-lib/chains/kerrigan'`
// must narrow correctly. `KerriganChainLib` is the type returned by
// `create('kerrigan')`.

import type {
  KerriganConfig,
  KerriganChainLib,
} from '../typings/chains/kerrigan';
import type { ChainLib } from '../typings/chain';

// The Config is a structural superset of ChainConfig with a narrow `name`.
const _name: 'kerrigan' = ({} as KerriganConfig).name;

// The ChainLib is a structural ChainLib.
const _check: ChainLib = {} as KerriganChainLib;

// chainName on it is the literal type.
const _chainName: 'kerrigan' = ({} as KerriganChainLib).chainName;
