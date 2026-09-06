# Multichain Library — Examples

All examples use the multi-chain factory pattern. Each chain has its own isolated library instance.

```javascript
// Node ESM
import { create, registerChain, chains } from '@maximus-chain/multichain-lib';

// Node CJS
const { create, registerChain, chains } = require('@maximus-chain/multichain-lib');
```

## List available chains

```javascript
console.log('Built-in chains:', chains());    // ['maximus', 'osmium']
```

## Create a built-in chain (MaximusChain)

```javascript
const maximus = create('maximus');
const { Address, Unit, Transaction, Script, Message, PrivateKey, HDPrivateKey, Mnemonic, Networks, HDPublicKey, ProRegTxPayload } = maximus;
```

## Convert between BTC and satoshis

```javascript
const sats = maximus.Unit.fromBTC(1.3).toSatoshis();
const btc = maximus.Unit.fromSatoshis(150000).toBTC();
```

## Create and save a Private Key

```javascript
const privateKey = new maximus.PrivateKey('testnet');
const wif = privateKey.toWIF();
const imported = maximus.PrivateKey.fromWIF(wif);
```

## Create an Address

```javascript
const address = privateKey.toAddress();
console.log(address.toString()); // MaximusChain testnet address
```

## Validate an Address

```javascript
maximus.Address.isValid('TNrWwZmTW9FQroUq3ohyT4RbJUrJ7JoRMd', 'testnet');
```

## HD Wallet — derive from mnemonic

```javascript
const mnemonic = new maximus.Mnemonic('praise sewer someone ladder aunt simple grit similar garlic quality know own');
const hdPrivateKey = maximus.HDPrivateKey.fromSeed(mnemonic.toSeed(), maximus.Networks.testnet);
const derived = hdPrivateKey.deriveChild("m/44'/1'/0'/0/0");
const address = derived.privateKey.toAddress();
```

## HD Wallet — derive child from xpub

```javascript
const hdPublicKey = new maximus.HDPublicKey('tpubD...');
const child = hdPublicKey.deriveChild("m/1/100", false);
const publicKey = child.publicKey;
```

## Build a 2-of-3 multisig P2SH address

```javascript
const publicKeys = [
  new maximus.PublicKey('02...'),
  new maximus.PublicKey('02...'),
  new maximus.PublicKey('02...'),
];
const redeemScript = maximus.Script.buildMultisigOut(publicKeys, 2);
const scriptHashOut = redeemScript.toScriptHashOut();
const multisigAddress = maximus.Address.payingTo(scriptHashOut, maximus.Networks.livenet);
```

## Create and sign a Transaction

```javascript
const privateKey = new maximus.PrivateKey('testnet');
const utxo = {
  txId: '115e8f72f39fad874cfab0deed11a80f24f967a84079fb56ddf53ea02e308986',
  outputIndex: 0,
  address: privateKey.toAddress().toString(),
  script: maximus.Script.buildPublicKeyHashOut(privateKey.toAddress()).toHex(),
  satoshis: 50000,
};

const transaction = new maximus.Transaction()
  .from(utxo)
  .to('TNrWwZmTW9FQroUq3ohyT4RbJUrJ7JoRMd', 15000)
  .feePerKb(1000)
  .change(privateKey.toAddress())
  .sign(privateKey);

console.log(transaction.serialize());
```

## Create a special ProRegTx

```javascript
const payload = new maximus.ProRegTxPayload();
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
payload.scriptPayout = maximus.Script.buildPublicKeyHashOut(
  new maximus.Address(payoutAddress, maximus.Networks.livenet)
).toHex();
payload.inputsHash = '0'.repeat(64);

const tx = new maximus.Transaction()
  .from(utxos)
  .to(collateralAddress, 1000000000)
  .feePerKb(1000)
  .change(changeAddress)
  .setExtraPayload(payload);

tx.version = 3;
tx.type = 1;
```

## Per-chain ProRegTxPayload defaults (e.g. Fewbit)

Fewbit Core only accepts `CProRegTx::CURRENT_VERSION = 1` and rejects
any `type != 0`. The lib's `ProRegTxPayload` on the fewbit chain reflects
both constraints out of the box:

```javascript
const fewbit = multichain.create('fewbit');

const payload = new fewbit.ProRegTxPayload();
// payload.version === 1   (FewBit Core's CURRENT_VERSION)
// payload.type    === undefined until the caller sets it

payload.type = 0; // MASTERNODE_TYPE_BASIC — required on Fewbit
payload.collateralHash = '...';
// ... rest of the fields ...
payload.toBuffer(); // validate() enforces type === 0; throws otherwise
```

The same fields still apply to other chains; `maximus` / `osmium`
default to Dash's `version = 2` and don't enforce `type === 0`.
`filopow` mirrors FILOPOW Core (`CProRegTx::CURRENT_VERSION = 1`,
rejects `type !== 0` and `mode !== 0`), so the lib ships with
`payloadVersions.proRegTx = 1`, `enforceMasternodeTypeBasic: true`, and
`enforceMasternodeModeBasic: true` already declared on the chain config.
Custom chains declared via `multichain.registerChain(name, config)` can
opt in by setting `payloadVersions.proRegTx` and/or
`enforceMasternodeTypeBasic: true` (and/or
`enforceMasternodeModeBasic: true`) on the config.

## Sign and verify a message

```javascript
const message = new maximus.Message('Welcome to Multichain');
const signature = message.sign(privateKey);
const verified = message.verify(privateKey.toAddress(), signature);
```

## Networks (active chain only)

```javascript
maximus.Networks.setActive('testnet');
console.log(maximus.Networks.defaultNetwork.name); // 'testnet'
console.log(maximus.Networks.livenet.name);        // 'livenet'
console.log(maximus.Networks.testnet.name);        // 'testnet'
```

## Register a custom chain

```javascript
multichain.registerChain('mychain', {
  name: 'mychain',
  messageMagic: 'MyChain Signed Message:\n',
  livenet: {
    name: 'livenet',
    alias: ['mainnet'],
    pubkeyhash: 0x00,
    privatekey: 0x80,
    scripthash: 0x05,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x0f0f0f0f,
    port: 8333,
    dnsSeeds: [],
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
  },
});

const mine = multichain.create('mychain');
const addr = new mine.Address(pubkeyHash, 'livenet');
```

## Register a custom hash algorithm on a chain

Custom algorithms are registered per chain after `create(name)` — there is no global registry:

```javascript
const mine = multichain.create('mychain');
mine.crypto.Hash.register('myalgo', (buf) => Buffer.from(myHash(buf)));
console.log(mine.crypto.Hash.list()); // ['myalgo']
```