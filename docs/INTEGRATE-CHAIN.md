# Integrate a new chain

This guide explains how to add support for a new cryptocurrency to `@maximus-chain/multichain-lib`. It covers both paths: adding a chain as built-in (modifies the library repository) and registering a chain at runtime (consumer-side only).

> Read this if you want the library to generate valid addresses, sign/verify messages, derive HD keys, and build transactions for a chain other than MaximusChain.

## Limitations

This library is a **UTXO-based, secp256k1, ECDSA-only** toolkit forked from the Bitcoin/Dash code lineage. Before starting, confirm the candidate chain matches the model. Chains that fall outside this model are **not** supportable as a configuration change alone.

| Category | Examples | Why it does not fit | What would need to change |
|----------|----------|---------------------|---------------------------|
| Account-based chains | Ethereum, BSC, Polygon, Avalanche C-Chain, Solana | Model is accounts with nonces and state, not unspent outputs | Rewrite `lib/transaction/transaction.js` and the input/output classes from scratch |
| Non-secp256k1 curves | Ed25519 chains (Solana, Stellar), sr25519 (Polkadot, Substrate), BLS-only | Address encoding, signing, key derivation all assume secp256k1 | Replace `lib/crypto/{ecdsa,point,signature,bls}.js` and `lib/hdprivatekey.js` |
| Shielded transactions | Zcash Sapling/Orchard, Monero, Pirate Chain | Outputs are opaque commitments, no script-based spending | Rewrite `lib/transaction/output.js`, `lib/script/`, `lib/transaction/sighash.js` |
| DAG-based ledgers | IOTA, Nano, Hedera Hashgraph | No blocks / no linear chain / no global UTXO set | Out of scope; needs a different library entirely |
| Substrate / FRAME chains | Polkadot, Kusama (non-Utxo) | Different runtime model; balances live in storage maps | Replace `Transaction`, `UnspentOutput`, `Address`, and the network registry |
| Chains with consensus tweaks | PoS-only, state rent, account abstraction, ZK-rollups | Validation rules and serialization diverge enough that porting is non-trivial | Extensive surgery across `lib/transaction/` and `lib/script/interpreter.js` |
| Federated sidechains without standard chainparams | Liquid, RSK, some private chains | The chainparams values are not exposed or do not follow the Bitcoin convention | Manual reverse-engineering of the source |

If your target chain is a Bitcoin-like UTXO chain (Bitcoin forks, Litecoin forks, Dash forks, Bitcoin Cash, Dogecoin, etc.), it fits this library with configuration only. Proceed below.

## Overview

A chain is described by two things:

1. A **network config** per environment (livenet and testnet) with version bytes, P2P magic, default port, and DNS seeds.
2. A **hash algorithm** (X11, SHA-256d, Scrypt, etc.) used for block headers and `Hash.forNetwork(buf, network)`.

Both live in `lib/chains/<name>.js`. The library's factory reads them and binds every class (Address, Transaction, Script, HDPrivateKey, Networks, ...) to that configuration.

The chain is wired into the factory through one of two paths:

- **Built-in**: create `lib/chains/<name>.js`, register it in `index.js`, ship via a PR.
- **Runtime**: call `multichain.registerChain(name, config)` from the consumer before `multichain.create(name)`.

Both paths use the same configuration shape. The fields below are identical.

## Configuration shape

A chain config is a plain JavaScript object. Top-level keys describe the chain; per-network keys describe the livenet and testnet networks.

### Chain-level (top of the file)

| Field | Required | Type | Purpose |
|-------|----------|------|---------|
| `name` | yes | `string` | Identifier used by `multichain.create(name)`. Lowercase, no spaces. |
| `messageMagic` | yes | `string` | Bytes prefixed to messages before signing. Usually ends with `\n`. |
| `algorithms` | no | `object` | Map of `{ name: (buf: Buffer) => Buffer }`. Each function takes a buffer and returns the hashed buffer. |
| `livenet` | yes | `object` | Configuration for the main network. See below. |
| `testnet` | yes | `object` | Configuration for the test network. See below. |

### Per-network (livenet and testnet)

| Field | Required | Type | Purpose |
|-------|----------|------|---------|
| `name` | yes | `'livenet'` / `'testnet'` | Internal identifier. Must be `'livenet'` or `'testnet'`. |
| `alias` | no | `string[]` | Alternative names (e.g. `['mainnet', 'maximus']`). Used by `Networks.get('mainnet')`. |
| `pubkeyhash` | yes | `number` | Version byte for P2PKH addresses (the leading byte of a base58 address). |
| `privatekey` | yes | `number` | Version byte for WIF private keys. |
| `scripthash` | yes | `number` | Version byte for P2SH addresses. |
| `xpubkey` | yes | `number` | Version bytes for extended public keys (BIP32). |
| `xprivkey` | yes | `number` | Version bytes for extended private keys (BIP32). |
| `xpubkey256bit` | no | `number` | 256-bit extended public key version (DIP-14 / SLIP-0132). Leave out if not used. |
| `xprivkey256bit` | no | `number` | 256-bit extended private key version (DIP-14 / SLIP-0132). Leave out if not used. |
| `networkMagic` | no | `number` | First 4 bytes of the P2P message header. Converted to a buffer automatically. |
| `port` | no | `number` | Default P2P port for the network. |
| `dnsSeeds` | no | `string[]` | DNS seed hostnames for peer discovery. |
| `messageMagic` | no | `string` | Per-network override for the chain-level `messageMagic`. Rarely needed. |
| `hashFunction` | no | `string` | Name of one of the functions in the chain's `algorithms`. Used by `Hash.forNetwork(buf, network)` for PoW-style hashing. |

> All numeric fields are interpreted as integers. Hexadecimal literals like `0x32` and decimal `50` are equivalent. Use whichever the source code uses.

### Hash algorithms (`algorithms`)

Each entry is a function `(buf: Buffer) => Buffer`. The library calls it via `Hash.forNetwork(buf, network)` when the network's `hashFunction` matches the entry's name.

Common algorithms:

- **SHA-256d** (Bitcoin): SHA-256 applied twice. Use Node's built-in `crypto` module.
- **X11** (Dash, MaximusChain): chain of 11 hashes. Use `@dashevo/x11-hash-js`.
- **Scrypt** (Litecoin): use Node's `crypto.scryptSync` with the chain's N/r/p parameters.
- **Keccak-256** (Ethereum-style): the `keccak256` package or Node 22's `crypto.hash('sha3-256', ..., 'hex')` after manual padding.

If the chain uses no PoW (PoS-only), you can omit `hashFunction` and the `algorithms` block. `Hash.forNetwork` will fall back to whatever algorithm was registered first.

## Where to find the values

Most UTXO chains are derived from Bitcoin Core, so the source file is usually `src/chainparams.cpp` (Bitcoin Core) or `src/chainparams.cpp` with the same layout in the fork.

| Field | Where to look | Bitcoin Core example |
|-------|---------------|---------------------|
| `pubkeyhash` | `base58Prefixes[PUBKEY_ADDRESS]` | `0x00` |
| `privatekey` | `base58Prefixes[SECRET_KEY]` | `0x80` |
| `scripthash` | `base58Prefixes[SCRIPT_ADDRESS]` | `0x05` |
| `xpubkey` | `base58Prefixes[EXT_PUBLIC_KEY]` | `0x0488B21E` |
| `xprivkey` | `base58Prefixes[EXT_SECRET_KEY]` | `0x0488ADE4` |
| `xpubkey256bit` | `base58Prefixes[EXT_PUBLIC_KEY]` in 256-bit builds (DIP-14) | `0x049d7cb2` |
| `xprivkey256bit` | `base58Prefixes[EXT_SECRET_KEY]` in 256-bit builds (DIP-14) | `0x049d7878` |
| `networkMagic` | `pchMessageStart[0..3]` in chainparams, or `consensus.networkMagic` | `0xf9beb4d9` |
| `port` | `nDefaultPort` | `8333` |
| `dnsSeeds` | `vSeeds` array | `["seed.bitcoin.sipa.be", ...]` |
| `messageMagic` | `strMessageMagic` in `src/util/message.cpp` | `"Bitcoin Signed Message:\n"` |
| `hashFunction` | `consensus.powAlgorithm` or `GetAlgorithm()` in `src/pow.cpp` | `"sha256d"` |

For Dash-style forks, look in `src/chainparams.cpp` and `src/chainparamsbase.cpp`. The 256-bit HD variants come from DIP-14 (`docs/dips/dip-14`).

### Quick sanity check after gathering values

A few checks to confirm the values you gathered are consistent:

- The address prefix letter(s) should match `pubkeyhash`:
  - `0x00` → `1...`, `0x05` → `3...`, `0x32` → `M...`, `0x6e` → `m...` or `n...`
- WIF private keys should start with `L` or `K` for `privatekey: 0x80` (mainnet Bitcoin).
- Extended keys (`xpub`/`xprv`) start with `xpub`/`xprv` for the standard BIP32 versions, or `drkv`/`drkp` for the legacy Dash SLIP-0132 versions.

If the prefix letter does not match, you probably picked the wrong byte from `base58Prefixes`.

## Implementing the hash algorithm

```javascript
// X11 (already provided by the maximus chain, copy the pattern)
const x11hash = require('@dashevo/x11-hash-js');
const x11 = (buf) => x11hash.digest(buf, 1, 1);

// SHA-256d (Bitcoin, no extra dependency)
const crypto = require('crypto');
const sha256d = (buf) =>
  crypto
    .createHash('sha256')
    .update(crypto.createHash('sha256').update(buf).digest())
    .digest();

// Scrypt (Litecoin, with the Litecoin-specific N=1024, r=1, p=1)
const scrypt = (buf) =>
  crypto.scryptSync(buf, buf, 32, { N: 1024, r: 1, p: 1, maxmem: 33554432 });
```

If the chain uses a hash that has no npm package yet (rare), wrap a native or WebAssembly implementation in a function with the same signature.

## Path A — Built-in (modify the repo)

1. Create `lib/chains/<name>.js`:

   ```javascript
   'use strict';

   var x11hash = require('@dashevo/x11-hash-js');

   module.exports = {
     name: 'mychain',
     messageMagic: 'MyChain Signed Message:\n',

     algorithms: {
       x11: function (buf) {
         return x11hash.digest(buf, 1, 1);
       },
     },

     livenet: {
       name: 'livenet',
       alias: ['mainnet'],
       pubkeyhash: 0x32,
       privatekey: 0x4b,
       scripthash: 0x05,
       xpubkey: 0x488b21e,
       xprivkey: 0x488ade4,
       networkMagic: 0x0a0a0a0a,
       port: 9999,
       dnsSeeds: ['seed.mychain.io'],
       messageMagic: 'MyChain Signed Message:\n',
       hashFunction: 'x11',
     },

     testnet: {
       name: 'testnet',
       pubkeyhash: 0x6e,
       privatekey: 0xef,
       scripthash: 0x0c,
       xpubkey: 0x043587cf,
       xprivkey: 0x04358394,
       networkMagic: 0x0b0b0b0b,
       port: 19999,
       dnsSeeds: [],
       messageMagic: 'MyChain Signed Message:\n',
       hashFunction: 'x11',
     },
   };
   ```

2. Register it in `index.js`:

   ```javascript
   ['maximus', 'mychain'].forEach(loadBuiltInChain);
   ```

3. Add tests covering at minimum: address generation, message sign/verify, HD derivation, network round-trip.

4. Commit and open a PR. Keep one chain per file; do not mix multiple chains in a single config.

## Path B — Runtime registration (consumer-side)

Useful when the chain is private, a fork of your own, or you do not want to publish the config upstream.

```javascript
const multichain = require('@maximus-chain/multichain-lib');

multichain.registerChain('mychain', {
  name: 'mychain',
  messageMagic: 'MyChain Signed Message:\n',
  algorithms: {
    x11: (buf) => require('@dashevo/x11-hash-js').digest(buf, 1, 1),
  },
  livenet: {
    name: 'livenet',
    pubkeyhash: 0x32,
    privatekey: 0x4b,
    scripthash: 0x05,
    xpubkey: 0x488b21e,
    xprivkey: 0x488ade4,
    hashFunction: 'x11',
  },
  testnet: {
    name: 'testnet',
    pubkeyhash: 0x6e,
    privatekey: 0xef,
    scripthash: 0x0c,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    hashFunction: 'x11',
  },
});

const mine = multichain.create('mychain');
console.log(mine.Networks.livenet.name); // 'livenet'
console.log(mine.crypto.Hash.list());   // ['x11']
```

The config shape is identical to the built-in path. Each chain's hash
registry is isolated from every other chain's — there is no global
registry to register algorithms on independently of a chain.

## Full example: Litecoin

```javascript
// lib/chains/litecoin.js
'use strict';

var crypto = require('crypto');

function scrypt(buf) {
  return crypto.scryptSync(buf, buf, 32, {
    N: 1024,
    r: 1,
    p: 1,
    maxmem: 33554432,
  });
}

module.exports = {
  name: 'litecoin',
  messageMagic: 'Litecoin Signed Message:\n',

  algorithms: {
    scrypt: scrypt,
  },

  livenet: {
    name: 'livenet',
    alias: ['mainnet'],
    pubkeyhash: 0x30,
    privatekey: 0xb0,
    scripthash: 0x32,
    xpubkey: 0x019da462,
    xprivkey: 0x019d9cfe,
    networkMagic: 0xfbc0b6db,
    port: 9333,
    dnsSeeds: [
      'dnsseed.litecointools.com',
      'seed.litecointools.com',
      'litecoin.lukechilds.co',
    ],
    messageMagic: 'Litecoin Signed Message:\n',
    hashFunction: 'scrypt',
  },

  testnet: {
    name: 'testnet',
    pubkeyhash: 0x6f,
    privatekey: 0xef,
    scripthash: 0xc4,
    xpubkey: 0x0436f6e1,
    xprivkey: 0x0436ef7d,
    networkMagic: 0xfdd2c8f1,
    port: 19335,
    dnsSeeds: [],
    messageMagic: 'Litecoin Signed Message:\n',
    hashFunction: 'scrypt',
  },
};
```

## Verification checklist

After adding a chain (built-in or runtime), run this minimum set of checks:

- [ ] `multichain.create(name)` returns an instance without throwing
- [ ] `instance.Networks.livenet.name === 'livenet'` and `instance.Networks.testnet.name === 'testnet'`
- [ ] `new instance.PrivateKey('livenet').toAddress().toString()` returns a valid address (verify on the chain's explorer)
- [ ] `new instance.Message('hi').sign(pk)` followed by `verify(addr, sig)` returns `true`
- [ ] `instance.HDPrivateKey.fromSeed(seed, instance.Networks.livenet).deriveChild("m/44'/2'/0'/0/0").privateKey.toAddress()` returns a deterministic address
- [ ] If `hashFunction` is set, `instance.crypto.Hash.forNetwork(Buffer.from('test'), instance.Networks.livenet)` produces the same output as a reference implementation
- [ ] `instance.Networks.enableRegtest()` switches port/magic/dnsSeeds to regtest values

If any of these fail, double-check the corresponding field in the chain config against the values in `chainparams.cpp`.

## Common mistakes

- **Wrong `xpubkey`/`xprivkey`** → HD keys deserialize incorrectly or are rejected.
- **Missing trailing `\n` in `messageMagic`** → signatures fail verification on the chain's reference implementation.
- **`hashFunction` set but algorithm not registered** → `Hash.forNetwork` throws `Unknown hash algorithm`.
- **Putting `xpubkey256bit` without `xprivkey256bit`** (or vice versa) → HD key validation logic (`lib/hdpublickey.js:337-340`) rejects otherwise valid keys.
- **Confusing `networkMagic` (uint32) with the full P2P message header (4 bytes)** → the library takes only the integer and serializes it as a 4-byte little-endian buffer. Check that the daemon agrees on the byte order.
- **Forgetting that the testnet is registered with `noStaticPort/NetworkMagic/DnsSeeds`** → the factory passes these flags automatically so the regtest-aware getters in `lib/networks.js` work. Consumers do not need to know about this.

## Questions or issues

Open an issue on https://github.com/Maximus-Chain/multichain-lib/issues with the `chain-integration` label.