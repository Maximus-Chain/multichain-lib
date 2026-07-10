// tsd test for the v3 root API.
//
// Verifies that:
//   - `create`, `chains`, `registerChain`, `createHashRegistry`, `version`
//     are exported and have the correct types.
//   - `create('maximus')` returns `MaximusChainLib` (narrowed).
//   - `create('osmium')` returns `OsmiumChainLib` (narrowed).
//   - `create(name)` for a custom string returns the generic `ChainLib`.
//   - Reusable code can take a generic `ChainLib` and accept any chain.

import {
  create,
  chains,
  registerChain,
  createHashRegistry,
  version,
} from '..';
import { default as multichain } from '..';
import type { ChainLib, ChainConfig, HashRegistry } from '../typings/chain';
import type { MaximusChainLib } from '../typings/chains/maximus';
import type { OsmiumChainLib } from '../typings/chains/osmium';

// Root API shapes.
const _v: string = version;
const _chainsList: string[] = chains();
const _reg: HashRegistry = createHashRegistry();
const _createFn: (n: 'maximus') => MaximusChainLib = create;

// `create` overloads: built-in chains are narrowed.
const m = create('maximus');
const _mChainName: 'maximus' = m.chainName;
const _mAddress: typeof m.Address = m.Address;
const _mPriv: InstanceType<typeof m.PrivateKey> = new m.PrivateKey('livenet');

const o = create('osmium');
const _oChainName: 'osmium' = o.chainName;

// Custom chain → generic ChainLib.
const customConfig: ChainConfig = {
  name: 'mycoin',
  messageMagic: 'MyCoin Signed Message:\n',
  livenet: {
    name: 'livenet',
    pubkeyhash: 23,
    privatekey: 176,
    scripthash: 13,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
  },
  testnet: {
    name: 'testnet',
    pubkeyhash: 111,
    privatekey: 239,
    scripthash: 196,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
  },
};
registerChain('mycoin', customConfig);
const c = create('mycoin');
const _cChainName: string = c.chainName;
const _cAddress: typeof c.Address = c.Address;

// Reusable signature: any ChainLib works.
function deriveAddress<C extends ChainLib>(lib: C): string {
  const pk = new lib.PrivateKey('livenet');
  return pk.toAddress().toString();
}

const _addrM: string = deriveAddress(m);
const _addrO: string = deriveAddress(o);
const _addrC: string = deriveAddress(c);

// Default export is the namespace as a whole.
const _m2: MaximusChainLib = multichain.create('maximus');
const _v2: string = multichain.version;