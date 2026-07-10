# Multichain Library

A pure, multi-chain cryptocurrency primitives library for UTXO-based,
secp256k1, ECDSA chains. Ships with built-in support for MaximusChain and
Osmium, and lets you register any other compatible chain at runtime.

Every chain is fully isolated: `create(name)` returns a self-contained
chain-lib (its own `Networks`, hash registry, and class closures), so two
chain-libs — even for the same chain name — are safe to use concurrently,
including across `await` boundaries.

```javascript
import { create } from '@maximus-chain/multichain-lib';

const maximus = create('maximus');
const address = new maximus.PrivateKey('livenet').toAddress().toString();
```

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Loading the library](#loading-the-library)
  - [Node (CJS and ESM)](#node-cjs-and-esm)
  - [Browser (CDN / `<script>` tag)](#browser-cdn--script-tag)
  - [Browser (bundler)](#browser-bundler)
- [Multi-chain usage](#multi-chain-usage)
  - [Built-in chains](#built-in-chains)
  - [Registering a custom chain](#registering-a-custom-chain)
  - [Isolation guarantees](#isolation-guarantees)
- [Subpath exports](#subpath-exports)
- [TypeScript](#typescript)
  - [Per-chain types](#per-chain-types)
  - [Reusable code across chains](#reusable-code-across-chains)
- [Components](#components)
  - [Address](#address)
  - [Unit](#unit)
  - [Transaction](#transaction)
  - [PrivateKey / PublicKey](#privatekey--publickey)
  - [HDPublicKey / HDPrivateKey](#hdpublickey--hdprivatekey)
  - [Script](#script)
  - [Message](#message)
  - [Mnemonic](#mnemonic)
  - [Networks](#networks)
  - [ProRegTxPayload](#proregtxpayload)
  - [UnspentOutput](#unspentoutput)
  - [Encoding helpers](#encoding-helpers)
- [Adding a new chain](#adding-a-new-chain)
- [Documentation](#documentation)
- [Tests](#tests)
- [License](#license)

## Install

```sh
npm install @maximus-chain/multichain-lib
```

## Quick start

```javascript
// Node ESM (or any modern bundler)
import { create } from '@maximus-chain/multichain-lib';

const maximus = create('maximus');
const privateKey = new maximus.PrivateKey('livenet');
const address = privateKey.toAddress().toString();
const message = new maximus.Message('hello').sign(privateKey);
console.log(address, message.toString('hex'));
```

The `create(name)` call returns a chain-lib with the full set of chain-bound
classes (`Address`, `PrivateKey`, `PublicKey`, `HDPublicKey`, `HDPrivateKey`,
`Script`, `Message`, `Transaction`, `ProRegTxPayload`, `Mnemonic`,
`UnspentOutput`, `Unit`, `Opcode`) plus the network (`Networks`) and helper
namespaces (`crypto`, `encoding`, `util`, `errors`).

## Loading the library

### Node (CJS and ESM)

The package ships with both entry points:

```javascript
// CJS — `main` in package.json
const { create } = require('@maximus-chain/multichain-lib');

// ESM — `module` in package.json
import { create } from '@maximus-chain/multichain-lib';
```

The default export is the full namespace (so `import multichain from '...'`
keeps working too):

```javascript
import multichain from '@maximus-chain/multichain-lib';
const maximus = multichain.create('maximus');
```

### Browser (CDN / `<script>` tag)

The UMD bundle is published to npm and resolves via the `unpkg` field, which
points at `dist/multichain-lib.min.js`. Include it directly:

```html
<script src="https://unpkg.com/@maximus-chain/multichain-lib/dist/multichain-lib.min.js"></script>
<script>
  const maximus = window.multichain.create('maximus');
  const privateKey = new maximus.PrivateKey();
  const address = privateKey.toAddress().toString();
  console.log(address);
</script>
```

### Browser (bundler)

If you use webpack / Rollup / Vite, prefer the ESM build (`module` field):

```javascript
import { create } from '@maximus-chain/multichain-lib';
```

Named imports are first-class: `create`, `chains`, `registerChain`,
`createHashRegistry`, `version`, and `versionGuard` are all exported.

## Multi-chain usage

### Built-in chains

```javascript
import { create, chains } from '@maximus-chain/multichain-lib';

console.log(chains()); // ['maximus', 'osmium']
const maximus = create('maximus');
const osmium = create('osmium');
```

Each built-in chain brings its own address prefixes, network magic, message
magic, and PoW hash algorithm.

### Registering a custom chain

A chain is described by two pieces of data:

1. A **network config** per environment (livenet and testnet) with version
   bytes, P2P magic, default port, and DNS seeds.
2. A **hash algorithm** map (e.g. X11, SHA-256d, Scrypt) used by
   `crypto.Hash.forNetwork`.

```javascript
import { create, registerChain } from '@maximus-chain/multichain-lib';

registerChain('mycoin', {
  name: 'mycoin',
  messageMagic: 'MyCoin Signed Message:\n',
  algorithms: {
    sha256d: (buf) => {
      // SHA-256 applied twice
      // ...
    },
  },
  livenet: {
    name: 'livenet',
    pubkeyhash: 0x00,
    privatekey: 0x80,
    scripthash: 0x05,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0xf9beb4d9,
    port: 8333,
    dnsSeeds: [],
    hashFunction: 'sha256d',
  },
  testnet: {
    name: 'testnet',
    pubkeyhash: 0x6f,
    privatekey: 0xef,
    scripthash: 0xc4,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    networkMagic: 0x0b0b0b0b,
    port: 18333,
    dnsSeeds: [],
    hashFunction: 'sha256d',
  },
});

const mine = create('mycoin');
console.log(mine.crypto.Hash.list()); // ['sha256d']
```

See [`docs/INTEGRATE-CHAIN.md`](docs/INTEGRATE-CHAIN.md) for the full list of
config fields, where to find them in a chain's source code, and verification
checklists.

### Isolation guarantees

Two chain-libs — whether for the same chain name or different ones — never
share state. There is no global, module-level "active chain" singleton
anywhere in the library. This means:

- Flipping `libA.Networks.setActive('testnet')` does not affect `libB`.
- A hash algorithm registered on one chain's config does not leak into another.
- It is safe to hold onto multiple chain-libs and use them concurrently from
  multiple `await` operations.

```javascript
const a = create('maximus');
const b = create('maximus');
a.Networks.setActive('testnet');
console.log(b.Networks.getActive().name); // 'livenet' — unchanged
```

## Subpath exports

Each built-in chain config is also reachable as a subpath export. This is
useful when you want to import a chain config to pass to `registerChain`
or just to keep a reference:

```javascript
// Import the config object as a value
import { config as maximusConfig } from '@maximus-chain/multichain-lib/chains/maximus';
import { config as osmiumConfig } from '@maximus-chain/multichain-lib/chains/osmium';

// Or as default import — same content
import maximusConfig from '@maximus-chain/multichain-lib/chains/maximus';
```

The TypeScript types at these subpaths narrow `create('<name>')` to the
chain-specific `ChainLib` (see below).

## TypeScript

The package ships first-class types. The root API surface is:

```typescript
import { create, chains, registerChain, createHashRegistry, version } from '@maximus-chain/multichain-lib';
import type { ChainLib, ChainConfig, HashRegistry } from '@maximus-chain/multichain-lib';
```

### Per-chain types

`create()` is overloaded so that built-in chains return their chain-specific
`ChainLib`:

```typescript
import { create } from '@maximus-chain/multichain-lib';
import type { MaximusChainLib } from '@maximus-chain/multichain-lib/chains/maximus';
import type { OsmiumChainLib } from '@maximus-chain/multichain-lib/chains/osmium';

const m: MaximusChainLib = create('maximus');
const o: OsmiumChainLib = create('osmium');

const lib = create('anyOtherName'); // typed as the generic ChainLib
```

`MaximusChainLib` and `OsmiumChainLib` are aliases for
`ChainLib<MaximusConfig>` / `ChainLib<OsmiumConfig>`, where the chain config
type carries a literal `name` so that `lib.chainName` is narrowed to
`'maximus'` / `'osmium'`.

### Reusable code across chains

The `ChainLib<C extends ChainConfig>` interface is generic. Code that wants
to be chain-agnostic takes `<C extends ChainLib>` (or `ChainLib`):

```typescript
import { create } from '@maximus-chain/multichain-lib';
import type { ChainLib } from '@maximus-chain/multichain-lib';

// Same function works for any chain.
function deriveAddress<C extends ChainLib>(lib: C): string {
  return new lib.PrivateKey('livenet').toAddress().toString();
}

const a = deriveAddress(create('maximus'));
const b = deriveAddress(create('osmium'));
```

Each call to `create()` returns a fresh `ChainLib` with its own `Networks`,
hash registry, and class closures, so passing the result into a generic
function never mixes instances across chains.

## Components

Every chain-lib returned by `create(name)` exposes the same shape. The
examples below assume `const lib = create('maximus');` (replace with any
chain).

### Address

```javascript
const pk = new lib.PrivateKey('livenet');
const address = pk.toAddress();
address.toString(); // chain-specific base58 string
lib.Address.isValid(address.toString(), 'livenet'); // true
```

### Unit

```javascript
const sats = lib.Unit.fromBTC(1.3).toSatoshis();
const btc = lib.Unit.fromSatoshis(150000).toBTC();
```

### Transaction

```javascript
const privateKey = new lib.PrivateKey('testnet');
const utxo = {
  txId: '115e8f72f39fad874cfab0deed11a80f24f967a84079fb56ddf53ea02e308986',
  outputIndex: 0,
  address: privateKey.toAddress().toString(),
  script: lib.Script.buildPublicKeyHashOut(privateKey.toAddress()).toHex(),
  satoshis: 50000,
};

const transaction = new lib.Transaction()
  .from(utxo)
  .to('tb1q...', 15000)
  .feePerKb(1000)
  .change(privateKey.toAddress())
  .sign(privateKey);

console.log(transaction.serialize());
```

### PrivateKey / PublicKey

```javascript
const pk = new lib.PrivateKey('livenet');
const pub = pk.toPublicKey();
const wif = pk.toWIF();
const reimported = lib.PrivateKey.fromWIF(wif);
```

### HDPublicKey / HDPrivateKey

```javascript
const mnemonic = new lib.Mnemonic(
  'praise sewer someone ladder aunt simple grit similar garlic quality know own'
);
const hd = lib.HDPrivateKey.fromSeed(mnemonic.toSeed(), lib.Networks.testnet);
const derived = hd.deriveChild("m/44'/1'/0'/0/0");
console.log(derived.privateKey.toAddress().toString());

// From an xpub
const hdPub = new lib.HDPublicKey('tpubD...');
const child = hdPub.deriveChild('m/1/100', false);
console.log(child.publicKey.toAddress().toString());
```

### Script

```javascript
const pk1 = new lib.PublicKey('02...');
const pk2 = new lib.PublicKey('02...');
const pk3 = new lib.PublicKey('02...');
const redeem = lib.Script.buildMultisigOut([pk1, pk2, pk3], 2);
const scriptHashOut = redeem.toScriptHashOut();
const multisigAddress = lib.Address.payingTo(scriptHashOut, lib.Networks.livenet);
```

### Message

```javascript
const message = new lib.Message('Welcome to Multichain');
const signature = message.sign(privateKey);
console.log(message.verify(privateKey.toAddress(), signature)); // true
```

### Mnemonic

```javascript
const m = new lib.Mnemonic(
  'praise sewer someone ladder aunt simple grit similar garlic quality know own'
);
console.log(m.toSeed().toString('hex'));
const hd = m.toHDPrivateKey(null, lib.Networks.livenet);
```

### Networks

Each chain-lib has its own `Networks` instance with `livenet` and `testnet`.
By default the chain-lib starts on `livenet`.

```javascript
lib.Networks.setActive('testnet');
console.log(lib.Networks.defaultNetwork.name); // 'testnet'
lib.Networks.enableRegtest(); // opt-in: switch port/magic to regtest values
```

### ProRegTxPayload

```javascript
const payload = new lib.ProRegTxPayload();
payload.version = 1;
payload.type = 1;
payload.mode = 0;
payload.collateralHash = '0'.repeat(64);
payload.collateralIndex = 0;
payload.service = '1.2.3.4:9999';
payload.keyIDOwner = '0'.repeat(40);
payload.pubKeyOperator = '0'.repeat(96);
payload.keyIDVoting = '0'.repeat(40);
payload.operatorReward = 0;
payload.scriptPayout = lib.Script.buildPublicKeyHashOut(
  new lib.Address(payoutAddress, lib.Networks.livenet)
).toHex();
payload.inputsHash = '0'.repeat(64);

const tx = new lib.Transaction()
  .from(utxos)
  .to(collateralAddress, 1000000000)
  .feePerKb(1000)
  .change(changeAddress)
  .setExtraPayload(payload);

tx.version = 3;
tx.type = 1;
```

### UnspentOutput

```javascript
const utxo = new lib.UnspentOutput({
  txId: '...',
  outputIndex: 0,
  address: '...',
  script: '...',
  satoshis: 50000,
});
```

### Encoding helpers

`lib.encoding` exposes `Base58`, `Base58Check`, `BufferReader`, `BufferWriter`,
and `Varint`. `lib.crypto` exposes `BN`, `ECDSA`, `Hash` (the chain's
isolated hash registry), `Point`, `Signature`, `Signer`, `Random`, `BLS`.

```javascript
lib.encoding.Base58.encode(Buffer.from('hi'));
lib.crypto.Hash.list(); // chain-specific algorithm names
```

## Adding a new chain

See [`docs/INTEGRATE-CHAIN.md`](docs/INTEGRATE-CHAIN.md) for:

- The full configuration shape (chain-level + per-network fields).
- Where to find each value in a chain's source code
  (`src/chainparams.cpp` for most Bitcoin-derived chains).
- A worked Litecoin example.
- A verification checklist.

## Documentation

- [`docs/migration/v3.md`](docs/migration/v3.md) — what changed in v3
  (chain isolation, removal of `createIsolated()`, the global hash registry,
  and `lib/_context.js`) plus the post-3.0.0 ESM / subpath / TS surface.
- [`docs/migration/v1-to-v2.md`](docs/migration/v1-to-v2.md) — migrating
  from `@maximus-chain/maximus-lib` (v1.x).
- [`docs/INTEGRATE-CHAIN.md`](docs/INTEGRATE-CHAIN.md) — add support for a
  new chain.
- [`docs/examples.md`](docs/examples.md) — copy-pasteable examples.

## Tests

```sh
git clone https://github.com/Maximus-Chain/multichain-lib
cd multichain-lib
npm install
npm test
```

This runs the full test pipeline: types (tsd), Node unit tests (vitest),
and browser end-to-end tests (Playwright).

You can also run each suite independently:

```sh
npm run test:types     # tsd, type assertions
npm run test:node      # vitest, Node-side unit tests
npm run test:browser   # playwright, browser bundle tests
npm run coverage       # vitest with v8 coverage
```

## License

Code released under [the MIT license](LICENSE).

Copyright 2026 MaximusChain.