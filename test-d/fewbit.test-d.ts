// tsd test for the per-chain subpath exports.
//
// `import type { FewbitConfig } from '@maximus-chain/multichain-lib/chains/fewbit'`
// must narrow correctly. `FewbitChainLib` is the type returned by
// `create('fewbit')`.

import type {
  FewbitConfig,
  FewbitChainLib,
} from '../typings/chains/fewbit';
import type { ChainLib } from '../typings/chain';

// The Config is a structural superset of ChainConfig with a narrow `name`.
const _name: 'fewbit' = ({} as FewbitConfig).name;

// The ChainLib is a structural ChainLib.
const _check: ChainLib = {} as FewbitChainLib;

// chainName on it is the literal type.
const _chainName: 'fewbit' = ({} as FewbitChainLib).chainName;
