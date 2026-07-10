# Multichain Library

A pure and powerful multi-chain cryptocurrency primitives library.

MaximusChain is a peer-to-peer platform for the next generation of financial technology. The decentralized nature of the network allows for highly resilient infrastructure.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Documentation](#documentation)
- [License](#license)

## Install

### NodeJS

```
npm install @maximus-chain/multichain-lib
```

### Browser

#### CDN Standalone

```html
<script src="https://unpkg.com/@maximus-chain/multichain-lib"></script>
<script>
  const multichain = maximus;
  const maximus = multichain.create('maximus');
  const privateKey = new maximus.PrivateKey();
  const address = privateKey.toAddress().toString();
  ...
</script>
```

#### Building the Browser Bundle

```sh
npm run build
```

This will generate a file named `multichain-lib.min.js` in the `dist/` folder.

## Usage

### Browser

```html
<script src="./dist/multichain-lib.min.js" type="text/javascript"></script>
<script>
  const multichain = window.multichain;
  const maximus = multichain.create('maximus');
  const PrivateKey = maximus.PrivateKey;
  const privateKey = new PrivateKey();
  const address = privateKey.toAddress().toString();
</script>
```

### Multi-chain support

The library is multi-chain: you specify which chain you want, and `create()`
returns a **fully isolated** library instance configured for that chain —
there is no shared, module-level "active chain" state anywhere in the
library. Two chain-libs, whether for the same chain name or different ones,
never affect each other, so they're safe to use concurrently, including
across `await` boundaries. MaximusChain and Osmium are registered as built-in
chains.

```javascript
const { create, registerChain, chains } = require('@maximus-chain/multichain-lib');

// Built-in chain (MaximusChain)
const maximus = create('maximus');
const addr = new maximus.Address('...', 'livenet');

// Register a custom chain with your own config
registerChain('mychain', {
  livenet: { /* ... */ },
  testnet: { /* ... */ },
  algorithms: {
    x11: (buf) => /* ... */,
  },
});
const mine = create('mychain');

// Two chain-libs are fully independent — safe to use interleaved with
// awaits, or concurrently from different requests.
const maximusAddr = new maximus.PrivateKey('livenet').toAddress();
maximus.Address.isValid(maximusAddr.toString(), 'livenet'); // true
mine.Address.isValid(maximusAddr.toString(), 'livenet'); // false

// Custom hash algorithms are declared per chain, in the config passed to
// registerChain() (see above) — there is no global hash-algorithm registry.
// A standalone, isolated registry can still be created directly if needed:
const registry = multichain.createHashRegistry();
registry.register('myalgo', (buf) => /* ... */);
```

`create()` returns the same shape regardless of chain (`Address`, `Script`,
`HDPublicKey`, `HDPrivateKey`, `PrivateKey`, `PublicKey`, `Message`,
`Transaction`, `ProRegTxPayload`, `Networks`, `crypto`, `encoding`, `util`,
`errors`, `Unit`, `Mnemonic`, `Opcode`, `chainName`).

See [docs/migration/v3.md](docs/migration/v3.md) if you're upgrading from an
earlier version that used a shared, non-isolated `create()` or the additive
`createIsolated()` API.

### Development & Tests

```sh
git clone https://github.com/Maximus-Chain/multichain-lib
cd multichain-lib
npm install
```

Run all the tests:

```sh
npm test
```

You can also run just the Node.js tests with `npm run test:node`, just the browser tests with `npm run test:browser` or run a test coverage report with `npm run coverage`.

## Supported API

The library exposes the components required to build, sign and broadcast transactions, manage addresses, derive HD keys, encode messages, and work with masternode provider registration payloads. Every chain is configured with its own data (address prefixes, network magic, message magic, hash algorithm).

| Component | Description |
|-----------|-------------|
| `Address` | Parse, validate and generate chain-specific addresses |
| `Unit` | Convert between BTC and satoshis |
| `Transaction` | Build, sign, serialize and deserialize transactions, including special ProRegTx |
| `HDPublicKey` / `HDPrivateKey` | BIP32 hierarchical deterministic key derivation |
| `PrivateKey` / `PublicKey` | Keypair generation, WIF, signing primitives |
| `Script` | Build P2PKH / P2SH / multisig scripts |
| `Message` | Sign and verify messages with chain-specific magic bytes |
| `Mnemonic` | BIP39 mnemonic phrases and seed derivation |
| `Networks` | Livenet / testnet configuration for the active chain |
| `ProRegTxPayload` | Masternode provider registration payload |

## Documentation

- [Core Concepts](core-concepts/)
- [Usage Guides](usage/)
- [Examples](examples.md)

## License

Code released under [the MIT license](../LICENSE).

Copyright 2026 MaximusChain.