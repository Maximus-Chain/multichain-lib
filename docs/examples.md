# MaximusChain Library — Examples

All examples assume you are using `maximus` from `@maximus-chain/maximus-lib`.

```javascript
const maximus = require('@maximus-chain/maximus-lib');
const { Address, Unit, Transaction, Script, Message, PrivateKey, HDPrivateKey, Mnemonic, Networks, HDPublicKey, ProRegTxPayload } = maximus;
```

## Convert between BTC and satoshis

```javascript
const sats = Unit.fromBTC(1.3).toSatoshis();
const btc = Unit.fromSatoshis(150000).toBTC();
```

## Create and save a Private Key

```javascript
const privateKey = new PrivateKey('testnet');
const wif = privateKey.toWIF();
const imported = PrivateKey.fromWIF(wif);
```

## Create an Address

```javascript
const address = privateKey.toAddress();
console.log(address.toString()); // 'T...' on testnet, 'M...' on livenet
```

## Validate an Address

```javascript
Address.isValid('TNrWwZmTW9FQroUq3ohyT4RbJUrJ7JoRMd', 'testnet'); // true
Address.isValid('MNxR2aqgyrKBrf3wUKYvyKQj9hTZ3SZMV7', 'livenet'); // true
```

## HD Wallet — derive from mnemonic

```javascript
const mnemonic = new Mnemonic('praise sewer someone ladder aunt simple grit similar garlic quality know own');
const hdPrivateKey = HDPrivateKey.fromSeed(mnemonic.toSeed(), Networks.testnet);
const derived = hdPrivateKey.deriveChild("m/44'/1'/0'/0/0");
const address = derived.privateKey.toAddress();
```

## HD Wallet — derive child from xpub

```javascript
const hdPublicKey = new HDPublicKey('tpubD...');
const child = hdPublicKey.deriveChild("m/1/100", false);
const publicKey = child.publicKey;
```

## Build a 2-of-3 multisig P2SH address

```javascript
const publicKeys = [
  new PublicKey('02...'),
  new PublicKey('02...'),
  new PublicKey('02...'),
];
const redeemScript = Script.buildMultisigOut(publicKeys, 2);
const scriptHashOut = redeemScript.toScriptHashOut();
const multisigAddress = Address.payingTo(scriptHashOut, Networks.livenet);
```

## Create and sign a Transaction

```javascript
const privateKey = new PrivateKey('testnet');
const utxo = {
  txId: '115e8f72f39fad874cfab0deed11a80f24f967a84079fb56ddf53ea02e308986',
  outputIndex: 0,
  address: privateKey.toAddress().toString(),
  script: Script.buildPublicKeyHashOut(privateKey.toAddress()).toHex(),
  satoshis: 50000,
};

const transaction = new Transaction()
  .from(utxo)
  .to('TNrWwZmTW9FQroUq3ohyT4RbJUrJ7JoRMd', 15000)
  .feePerKb(1000)
  .change(privateKey.toAddress())
  .sign(privateKey);

console.log(transaction.serialize());
```

## Create a special ProRegTx

```javascript
const payload = new ProRegTxPayload();
payload.version = 1;
payload.type = 1; // masternode type
payload.mode = 0;
payload.collateralHash = '0000000000000000000000000000000000000000000000000000000000000000';
payload.collateralIndex = 0;
payload.service = '1.2.3.4:9999';
payload.keyIDOwner = '0'.repeat(40);
payload.pubKeyOperator = '0'.repeat(96);
payload.keyIDVoting = '0'.repeat(40);
payload.operatorReward = 0;
payload.scriptPayout = Script.buildPublicKeyHashOut(new Address(payoutAddress, Networks.livenet)).toHex();
payload.inputsHash = '0'.repeat(64);

const tx = new Transaction()
  .from(utxos)
  .to(collateralAddress, 1000000000)
  .feePerKb(1000)
  .change(changeAddress)
  .setExtraPayload(payload);

tx.version = 3;
tx.type = 1;
```

## Sign and verify a message

```javascript
const message = new Message('Welcome to MaximusChain');
const signature = message.sign(privateKey);
const verified = message.verify(privateKey.toAddress(), signature); // true
```

## Networks

```javascript
Networks.setActive('testnet');
const active = Networks.defaultNetwork; // current network
const livenet = Networks.livenet;
const testnet = Networks.testnet;
```