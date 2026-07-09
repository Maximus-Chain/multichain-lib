# Migration Guide

This guide explains how to migrate projects that consume `@maximus-chain/maximus-lib` (v1.x) to `@maximus-chain/multichain-lib` (v2.x).

> Generated: 2026-07-09. Target version: `@maximus-chain/multichain-lib@^2.0.0`

## Overview of changes

The library was renamed and restructured around a multi-chain factory. The functional surface used by MaximusChain consumers is preserved, but every reference to the library now goes through a `create(chainName)` factory.

| v1.x (`@maximus-chain/maximus-lib`) | v2.x (`@maximus-chain/multichain-lib`) |
|------------------------------------|----------------------------------------|
| Package name `@maximus-chain/maximus-lib` | Package name `@maximus-chain/multichain-lib` |
| Static API: `require('...').Address` | Factory API: `require('...').create('maximus').Address` |
| `bitcore` global identifier | `multichain` global identifier |
| `_dashcore` global | `_multichain` global |
| Single hard-coded chain (MaximusChain) | Multi-chain via `registerChain(name, config)` |
| No chain-configurable hash algorithm | `chains.<name>.algorithms` + `hashFunction` per network |
| Default export of Networks at module load | Networks obtained from `create()` instance |
| `Networks.setActive(...)` | Same — `Networks.setActive(...)` (unchanged) |
| Top-level `setNetwork` (consumer wrapper) | Use `Networks.setActive` directly (no top-level alias) |
| MaximusChain constants hard-coded in `lib/networks.js` | Extracted to `lib/chains/maximus.js` (config data) |

## Step-by-step migration

### 1. Update the npm dependency

```sh
npm uninstall @maximus-chain/maximus-lib
npm install @maximus-chain/multichain-lib
```

Update `package.json` and `package-lock.json` references in your project.

### 2. Update import paths

**Before:**

```typescript
import { PrivateKey, Transaction, Networks } from '@maximus-chain/maximus-lib';
// or
const { PrivateKey, Transaction, Networks } = require('@maximus-chain/maximus-lib');
```

**After:**

```typescript
import { create } from '@maximus-chain/multichain-lib';

const maximus = create('maximus');
const { PrivateKey, Transaction, Networks } = maximus;
```

If your project has a central wrapper (for example `src/utils/maximusLib.ts`), update it once and let the rest of the codebase keep importing the wrapper as before:

```typescript
// src/utils/maximusLib.ts
import multichain from '@maximus-chain/multichain-lib';

const maximus = multichain.create('maximus');

export type Network = 'livenet' | 'testnet';

export function getMaximusLib(): typeof maximus {
  return maximus;
}

export function clearCache(): void {
  // No-op: factory-only, no caching needed.
}
```

Everything downstream continues to use the wrapper:

```typescript
import { getMaximusLib } from './maximusLib';
const { Address, Transaction } = getMaximusLib();
```

### 3. Replace `setNetwork` with `Networks.setActive`

The frontend migration referenced a top-level `setNetwork(name)`. That was a wrapper-level helper that does not exist as a public API in v2.x. Use `Networks.setActive` instead.

**Before:**

```typescript
import { setNetwork } from '@maximus-chain/maximus-lib';
setNetwork('livenet');
```

**After:**

```typescript
import { create } from '@maximus-chain/multichain-lib';
const { Networks } = create('maximus');
Networks.setActive('livenet');
```

### 4. Replace `_dashcore` / `bitcore` globals

**Before:**

```typescript
console.log(global._dashcore); // 'v1.x.x'
```

**After:**

```typescript
console.log(global._multichain); // 'v2.x.x'
```

### 5. Custom module declaration `types/maximus-lib-payload.d.ts`

If your project declared:

```typescript
declare module 'maximus-lib/lib/transaction/payload' { ... }
```

…that declaration is no longer needed. The v2.x library exports `ProRegTxPayload` (and other payload helpers) from its main `index.d.ts`.

### 6. Update tests

If your tests directly imported the library root, change them to use the factory:

**Before:**

```typescript
import { Address, Networks } from '@maximus-chain/maximus-lib';
const addr = new Address('...', 'livenet');
```

**After:**

```typescript
import { create } from '@maximus-chain/multichain-lib';
const { Address, Networks } = create('maximus');
const addr = new Address('...', 'livenet');
```

## Component-by-component reference

These classes and helpers keep their signatures, but are obtained from the `create('maximus')` instance instead of the root module.

### `Unit`

```typescript
const { Unit } = create('maximus');
Unit.fromBTC(1.3).toSatoshis();
Unit.fromSatoshis(150000).toBTC();
```

### `Transaction`

```typescript
const { Transaction } = create('maximus');
const tx = new Transaction()
  .from(utxos)
  .to(address, satoshis)
  .change(changeAddress)
  .feePerKb(1000)
  .sign(privateKey);

tx.setExtraPayload(payload);
tx.serialize();
tx.toObject();
tx.getFee();
tx.inputAmount;
tx.version = 3;
tx.type = 1;
```

### `HDPublicKey`

```typescript
const { HDPublicKey } = create('maximus');
const hd = new HDPublicKey(xpub);
const child = hd.deriveChild('m/1/100', false);
const pubkey = child.publicKey;
```

### `HDPrivateKey`

```typescript
const { HDPrivateKey } = create('maximus');
const hd = HDPrivateKey.fromSeed(seed, Networks.testnet);
const child = hd.deriveChild("m/44'/1'/0'/0/0");
const pk = child.privateKey;
```

### `Address`

```typescript
const { Address } = create('maximus');
Address.isValid(addr, 'livenet');    // MAXI address
Address.isValid(addr, 'testnet');    // TMAXI address
new Address(addr, 'testnet').toString();
addr.hashBuffer;
```

### `Script`

```typescript
const { Script } = create('maximus');
Script.buildMultisigOut([pk1, pk2, pk3], 2);
Script.fromAddress(addr);
new Script(buffer).toScriptHashOut();
script.toBuffer();
new Script(hex).toAddress('livenet');
```

### `Message`

```typescript
const { Message } = create('maximus');
const msg = Message.fromString('hello');
msg.verify(address, signature);
```

### `PublicKey`

```typescript
const { PublicKey } = create('maximus');
const pk = new PublicKey(hex);
pk.toBuffer();
```

### `PrivateKey`

```typescript
const { PrivateKey } = create('maximus');
const pk = new PrivateKey('testnet');
const wif = pk.toWIF();
const imported = PrivateKey.fromWIF(wif);
```

### `Mnemonic`

```typescript
const { Mnemonic } = create('maximus');
const m = new Mnemonic(phrase);
const seed = m.toSeed();
```

### `Networks`

```typescript
const { Networks } = create('maximus');
Networks.setActive('livenet');
Networks.defaultNetwork;
Networks.livenet;
Networks.testnet;
Networks.add(customNetwork);
```

### `ProRegTxPayload`

```typescript
const { ProRegTxPayload } = create('maximus');
const p = new ProRegTxPayload();
p.version = 1;
p.type = 1;
p.mode = 0;
p.collateralHash = '...';
p.collateralIndex = 0;
p.service = '1.2.3.4:9999';
p.keyIDOwner = '...';
p.pubKeyOperator = '...';
p.keyIDVoting = '...';
p.operatorReward = 0;
p.scriptPayout = '...';
p.inputsHash = '...';

p.toBuffer({ skipSignature: true });
p.toJSON({ skipSignature: true, network });
```

## Multi-chain support (new)

The factory accepts any registered chain. Register custom chains before calling `create`:

```typescript
import { registerChain, create } from '@maximus-chain/multichain-lib';

registerChain('mychain', {
  name: 'mychain',
  messageMagic: 'MyChain Signed Message:\n',
  algorithms: {
    sha256d: (buf) => /* SHA-256d implementation */,
  },
  livenet: {
    name: 'livenet',
    alias: ['mainnet'],
    pubkeyhash: 0x00,
    privatekey: 0x80,
    scripthash: 0x05,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x12345678,
    port: 8333,
    dnsSeeds: [],
    hashFunction: 'sha256d',
  },
  testnet: { /* ... */ },
});

const mine = create('mychain');
const addr = new mine.Address(pubkeyHash, 'livenet');
```

Register custom hash algorithms independently:

```typescript
import { registerAlgorithm, algorithms } from '@maximus-chain/multichain-lib';

registerAlgorithm('myalgo', (buf) => /* ... */);
console.log(algorithms()); // ['x11', 'myalgo']
```

## Checklist

- [ ] Replace `@maximus-chain/maximus-lib` with `@maximus-chain/multichain-lib`
- [ ] Update the central wrapper (if any) to call `multichain.create('maximus')`
- [ ] Replace `setNetwork('livenet')` with `Networks.setActive('livenet')`
- [ ] Remove `types/maximus-lib-payload.d.ts` (no longer needed)
- [ ] Replace `_dashcore` with `_multichain` (if referenced)
- [ ] Update tests to obtain classes from `create('maximus')`
- [ ] Verify build, lint, and tests pass

## Questions or issues

Open an issue on https://github.com/Maximus-Chain/multichain-lib/issues with the `migration` label.