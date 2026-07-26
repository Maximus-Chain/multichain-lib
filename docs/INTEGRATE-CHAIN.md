# Integrate a new chain

This guide explains how to add support for a new cryptocurrency to `@maximus-chain/multichain-lib`. It covers both paths: adding a chain as built-in (modifies the library repository) and registering a chain at runtime (consumer-side only).

> Read this if you want the library to generate valid addresses, sign/verify messages, derive HD keys, and build transactions for a chain other than the built-ins.

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

If your target chain is a Bitcoin-like UTXO chain (Bitcoin forks, Litecoin forks, Dash forks, Bitcoin Cash, Dogecoin, Ravencoin forks, filopow, etc.), it fits this library with configuration only. Proceed below.

## Scope: addresses, keys, transactions. Not block validation.

This library handles **client-side primitives**: addresses, WIF private keys, HD derivation (BIP32/39/44), mnemonics, transactions (P2PKH, P2SH, multisig), and message sign/verify (the Bitcoin-style "Signed Message:\n" framing). It does not implement block validation, mining, or PoW hashing. Block validation is the daemon's responsibility — talk to it via RPC.

The library exposes a small hash registry (`chainLib.crypto.Hash`) with the pure Bitcoin/Dash hashes (`sha256`, `sha256sha256`, `sha256ripemd160`, `ripemd160`, `sha512`, `hmac`, `sha256hmac`, `sha512hmac`, `sha1`). Consumers who need to hash arbitrary payloads — including block-header-style data for chain-specific PoW algorithms — can register their own algorithms via `hashRegistry.register(name, fn)`. No chain config wires this up automatically.

## Overview

A chain is described by a single `ChainConfig` object with one network config per environment (livenet, testnet). Version bytes, P2P magic, default port, DNS seeds, and the message magic are all declared there.

The chain is wired into the factory through one of two paths:

- **Built-in**: create `lib/chains/<name>.js`, register it in `lib/_create.js`, ship via a PR.
- **Runtime**: call `multichain.registerChain(name, config)` from the consumer before `multichain.create(name)`.

Both paths use the same configuration shape. The fields below are identical.

## Configuration shape

A chain config is a plain JavaScript object. Top-level keys describe the chain; per-network keys describe the livenet and testnet networks.

### Chain-level (top of the file)

| Field | Required | Type | Purpose |
|-------|----------|------|---------|
| `name` | yes | `string` | Identifier used by `multichain.create(name)`. Lowercase, no spaces. |
| `messageMagic` | yes | `string` | Bytes prefixed to messages before signing. Usually ends with `\n`. |
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
| `supportsIPv6` | no | `boolean` | Opt-in flag for `ProRegTxPayload.service` to accept `[ipv6]:port` strings. Default `false`. |

> All numeric fields are interpreted as integers. Hexadecimal literals like `0x32` and decimal `50` are equivalent. Use whichever the source code uses.

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

For Dash-style forks, look in `src/chainparams.cpp` and `src/chainparamsbase.cpp`. The 256-bit HD variants come from DIP-14 (`docs/dips/dip-14`).

### Quick sanity check after gathering values

A few checks to confirm the values you gathered are consistent:

- The address prefix letter(s) should match `pubkeyhash`:
  - `0x00` → `1...`, `0x05` → `3...`, `0x32` → `M...`, `0x6e` → `m...` or `n...`
- WIF private keys should start with `L` or `K` for `privatekey: 0x80` (mainnet Bitcoin).
- Extended keys (`xpub`/`xprv`) start with `xpub`/`xprv` for the standard BIP32 versions, or `drkv`/`drkp` for the legacy Dash SLIP-0132 versions.

If the prefix letter does not match, you probably picked the wrong byte from `base58Prefixes`.

## Path A — Built-in (modify the repo)

1. Create `lib/chains/<name>.js`:

   ```javascript
   'use strict';

   module.exports = {
     name: 'mychain',
     messageMagic: 'MyChain Signed Message:\n',

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
     },
   };
   ```

2. Register it in `lib/_create.js`:

   ```javascript
   loadBuiltInChain('maximus');
   loadBuiltInChain('osmium');
   loadBuiltInChain('filopow');
   loadBuiltInChain('mychain');
   ```

   Or, equivalently:

   ```javascript
   ['maximus', 'osmium', 'filopow', 'mychain'].forEach(loadBuiltInChain);
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
  livenet: {
    name: 'livenet',
    pubkeyhash: 0x32,
    privatekey: 0x4b,
    scripthash: 0x05,
    xpubkey: 0x488b21e,
    xprivkey: 0x488ade4,
  },
  testnet: {
    name: 'testnet',
    pubkeyhash: 0x6e,
    privatekey: 0xef,
    scripthash: 0x0c,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
  },
});

const mine = multichain.create('mychain');
console.log(mine.Networks.livenet.name); // 'livenet'
```

The config shape is identical to the built-in path.

## Registering a custom hash algorithm on a chain

The chain's `crypto.Hash` registry exposes the standard Bitcoin/Dash hashes. If you need to hash arbitrary payloads (chain-specific PoW header hash, custom HMAC scheme, etc.), register your own algorithm at runtime:

```javascript
const filopow = multichain.create('filopow');

// Register a chain-specific algorithm. The contract is (buf: Buffer) => Buffer.
filopow.crypto.Hash.register('kawpow_marker', function (buf) {
  // Production callers would shell out to a native binding here, e.g.
  // return require('foundation-kawpow').hashOne(headerHash, nonce, height, ...);
  return require('crypto').createHash('sha256').update(buf).digest();
});

// List every algorithm registered on this chain (built-in hashes are not listed).
console.log(filopow.crypto.Hash.list()); // ['kawpow_marker']

// Look up and call it.
const h = filopow.crypto.Hash.get('kawpow_marker')(Buffer.from('header', 'utf8'));
```

Each chain's registry is fully isolated — registering on `filopow.crypto.Hash` does not affect `maximus.crypto.Hash`.

## Verification checklist

After adding a chain (built-in or runtime), run this minimum set of checks:

- [ ] `multichain.create(name)` returns an instance without throwing
- [ ] `instance.Networks.livenet.name === 'livenet'` and `instance.Networks.testnet.name === 'testnet'`
- [ ] `new instance.PrivateKey('livenet').toAddress().toString()` returns a valid address (verify on the chain's explorer)
- [ ] `new instance.Message('hi').sign(pk)` followed by `verify(addr, sig)` returns `true`
- [ ] `instance.HDPrivateKey.fromSeed(seed, instance.Networks.livenet).deriveChild("m/44'/2'/0'/0/0").privateKey.toAddress()` returns a deterministic address
- [ ] `instance.Networks.enableRegtest()` switches port/magic/dnsSeeds to regtest values

If any of these fail, double-check the corresponding field in the chain config against the values in `chainparams.cpp`.

## Common mistakes

- **Wrong `xpubkey`/`xprivkey`** → HD keys deserialize incorrectly or are rejected.
- **Missing trailing `\n` in `messageMagic`** → signatures fail verification on the chain's reference implementation.
- **Putting `xpubkey256bit` without `xprivkey256bit`** (or vice versa) → HD key validation logic (`lib/hdpublickey.js:337-340`) rejects otherwise valid keys.
- **Confusing `networkMagic` (uint32) with the full P2P message header (4 bytes)** → the library takes only the integer and serializes it as a 4-byte little-endian buffer. Check that the daemon agrees on the byte order.
- **Forgetting that the testnet is registered with `noStaticPort/NetworkMagic/DnsSeeds`** → the factory passes these flags automatically so the regtest-aware getters in `lib/networks.js` work. Consumers do not need to know about this.

## Questions or issues

Open an issue on https://github.com/Maximus-Chain/multichain-lib/issues with the `chain-integration` label.