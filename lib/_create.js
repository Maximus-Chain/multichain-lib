/* eslint-disable */
// Internal: v3 multi-instance factory. Not part of the public API surface
// (re-exported through `index.mjs` / `index.cjs` / the webpack bundles).
//
// Kept as CommonJS so the ESM entry can `import` it via Node's CJS↔ESM
// interop without pulling in the whole toolchain's polyfills.

'use strict';

const Hash = require('./crypto/hash');

const version = 'v' + require('../package.json').version;

// Defensive guard: warn if two copies of the library are loaded into
// the same process. (Pre-v3 behavior preserved for backward compat.)
function versionGuard(previousVersion) {
  if (previousVersion !== undefined) {
    // eslint-disable-next-line no-console
    console.warn(
      'More than one instance of multichain-lib found. ' +
        'Please make sure that you are not mixing instances of classes of different versions of multichain-lib.'
    );
  }
}
versionGuard(global._multichain);
global._multichain = version;

const chainsRegistry = {};

function loadBuiltInChain(name) {
  chainsRegistry[name] = require('./chains/' + name);
}

loadBuiltInChain('maximus');
loadBuiltInChain('osmium');

function listChains() {
  return Object.keys(chainsRegistry);
}

function registerChain(name, config) {
  if (!config || !config.livenet || !config.testnet) {
    throw new Error('Chain config must include livenet and testnet');
  }
  chainsRegistry[name] = config;
}

const createNetworks = require('./networks').create;

function create(chainName) {
  const config = chainsRegistry[chainName];
  if (!config) {
    throw new Error(
      'Unknown chain: "' +
        chainName +
        '". Available: ' +
        Object.keys(chainsRegistry).join(', ')
    );
  }

  const Networks = createNetworks();
  Networks.add(config.livenet);
  Networks.add(config.testnet, {
    noStaticNetworkMagic: true,
    noStaticPort: true,
    noStaticDnsSeeds: true,
  });
  Networks.setActive('livenet');

  const hashRegistry = Hash.createHashRegistry();
  if (config.algorithms) {
    Object.keys(config.algorithms).forEach(function (name) {
      hashRegistry.register(name, config.algorithms[name]);
    });
  }

  const Address = require('./address').createAddressClass(Networks);
  const Script = require('./script/script').createScriptClass(Networks);
  Script.Interpreter =
    require('./script/interpreter').createInterpreterClass(Networks);
  const HDPublicKey =
    require('./hdpublickey').createHDPublicKeyClass(Networks);
  const HDPrivateKey =
    require('./hdprivatekey').createHDPrivateKeyClass(Networks);
  const PrivateKey = require('./privatekey').createPrivateKeyClass(Networks);
  const PublicKey = require('./publickey').createPublicKeyClass(Networks);
  const Message = require('./message').createMessageClass(Networks);

  const Transaction =
    require('./transaction/transaction').createTransactionClass(Networks);
  const TransactionSighash =
    require('./transaction/sighash').createSighash(Networks);
  Transaction.sighash = TransactionSighash;
  Transaction.Sighash = TransactionSighash;
  Transaction.Input =
    require('./transaction/input').createInputClasses(Networks);
  Transaction.Output =
    require('./transaction/output').createOutputClass(Networks);
  Transaction.UnspentOutput =
    require('./transaction/unspentoutput').createUnspentOutputClass(Networks);
  Transaction.Signature =
    require('./transaction/signature').createTransactionSignatureClass(
      Networks
    );

  const Payload =
    require('./transaction/payload').createPayloadClass(Networks);
  Transaction.Payload = Payload;

  const cryptoNs = {
    BN: require('./crypto/bn'),
    ECDSA: require('./crypto/ecdsa'),
    Hash: hashRegistry,
    Random: require('./crypto/random'),
    Point: require('./crypto/point'),
    Signature: require('./crypto/signature'),
    BLS: require('./crypto/bls'),
  };
  cryptoNs.Signer = require('./crypto/signer');

  const encodingNs = {
    Base58: require('./encoding/base58'),
    Base58Check: require('./encoding/base58check'),
    BufferReader: require('./encoding/bufferreader'),
    BufferWriter: require('./encoding/bufferwriter'),
    Varint: require('./encoding/varint'),
  };

  const utilNs = {
    buffer: require('./util/buffer'),
    js: require('./util/js'),
    preconditions: require('./util/preconditions'),
    bitarray: require('./util/bitarray'),
    ip: require('./util/ip'),
    isHashQuorumIndexRequired: require('./util/isHashQuorumIndexRequired'),
  };

  return {
    Networks: Networks,
    chainName: chainName,

    Address: Address,
    Script: Script,
    HDPublicKey: HDPublicKey,
    HDPrivateKey: HDPrivateKey,
    PrivateKey: PrivateKey,
    PublicKey: PublicKey,
    Message: Message,

    Transaction: Transaction,
    ProRegTxPayload: Payload.ProRegTxPayload,

    Unit: require('./unit'),
    Mnemonic: require('./mnemonic').createMnemonicClass(Networks),
    Opcode: require('./opcode'),

    crypto: cryptoNs,
    encoding: encodingNs,
    util: utilNs,
    errors: require('./errors'),
  };
}

module.exports = {
  version: version,
  versionGuard: versionGuard,
  create: create,
  chains: listChains,
  registerChain: registerChain,
  createHashRegistry: Hash.createHashRegistry,
};