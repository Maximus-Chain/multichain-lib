// tsd test for the per-chain subpath exports.
//
// `import type { MaximusConfig } from '@maximus-chain/multichain-lib/chains/maximus'`
// must narrow correctly. `MaximusChainLib` and `OsmiumChainLib` are the
// types returned by `create('maximus')` / `create('osmium')`.

import type {
  MaximusConfig,
  MaximusChainLib,
} from '../typings/chains/maximus';
import type {
  OsmiumConfig,
  OsmiumChainLib,
} from '../typings/chains/osmium';
import type { ChainLib } from '../typings/chain';

// Each Config is a structural superset of ChainConfig with a narrow `name`.
const _maximusName: 'maximus' = ({} as MaximusConfig).name;
const _osmiumName: 'osmium' = ({} as OsmiumConfig).name;

// Each ChainLib is a structural ChainLib.
const _checkMax: ChainLib = {} as MaximusChainLib;
const _checkOsm: ChainLib = {} as OsmiumChainLib;

// chainName on each is the literal type.
const _mChainName: 'maximus' = ({} as MaximusChainLib).chainName;
const _oChainName: 'osmium' = ({} as OsmiumChainLib).chainName;