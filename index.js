/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var multichain = module.exports;

multichain.version = 'v' + require('./package.json').version;

multichain.versionGuard = function (version) {
  if (version !== undefined) {
    var message =
      'More than one instance of multichain-lib found. ' +
      'Please make sure that you are not mixing instances of classes of different versions of multichain-lib.';
    console.warn(message);
  }
};
multichain.versionGuard(global._multichain);
global._multichain = multichain.version;

var Hash = require('./lib/crypto/hash');

var chainsRegistry = {};

function loadBuiltInChain(name) {
  chainsRegistry[name] = require('./lib/chains/' + name);
}

['maximus', 'osmium'].forEach(loadBuiltInChain);

multichain.chains = function () {
  return Object.keys(chainsRegistry);
};

multichain.registerChain = function (name, config) {
  if (!config || !config.livenet || !config.testnet) {
    throw new Error('Chain config must include livenet and testnet');
  }
  chainsRegistry[name] = config;
};

var createNetworks = require('./lib/networks').create;

/**
 * Returns a `ChainLib` for `chainName`: a set of classes (`Address`,
 * `Script`, `HDPublicKey`, `HDPrivateKey`, `PrivateKey`, `PublicKey`,
 * `Message`, `Transaction`, `ProRegTxPayload`, ...) that close over their own
 * private `Networks` instance and hash registry.
 *
 * Two chain-libs — whether for the same chain name or different ones — are
 * fully isolated from each other: there is no shared, module-level "active
 * chain" state anywhere in the library, so they can be used concurrently,
 * including across `await` boundaries, without one call corrupting the
 * other's state.
 *
 * @param {string} chainName
 * @returns {Object} a ChainLib
 */
multichain.create = function (chainName) {
  var config = chainsRegistry[chainName];
  if (!config) {
    throw new Error(
      'Unknown chain: "' +
        chainName +
        '". Available: ' +
        Object.keys(chainsRegistry).join(', ')
    );
  }

  var Networks = createNetworks();
  Networks.add(config.livenet);
  Networks.add(config.testnet, {
    noStaticNetworkMagic: true,
    noStaticPort: true,
    noStaticDnsSeeds: true,
  });
  Networks.setActive('livenet');

  var hashRegistry = Hash.createHashRegistry();
  if (config.algorithms) {
    Object.keys(config.algorithms).forEach(function (name) {
      hashRegistry.register(name, config.algorithms[name]);
    });
  }

  var Address = require('./lib/address').createAddressClass(Networks);
  var Script = require('./lib/script/script').createScriptClass(Networks);
  Script.Interpreter =
    require('./lib/script/interpreter').createInterpreterClass(Networks);
  var HDPublicKey =
    require('./lib/hdpublickey').createHDPublicKeyClass(Networks);
  var HDPrivateKey =
    require('./lib/hdprivatekey').createHDPrivateKeyClass(Networks);
  var PrivateKey = require('./lib/privatekey').createPrivateKeyClass(Networks);
  var PublicKey = require('./lib/publickey').createPublicKeyClass(Networks);
  var Message = require('./lib/message').createMessageClass(Networks);

  var Transaction =
    require('./lib/transaction/transaction').createTransactionClass(Networks);
  var TransactionSighash =
    require('./lib/transaction/sighash').createSighash(Networks);
  Transaction.sighash = TransactionSighash;
  Transaction.Sighash = TransactionSighash;
  Transaction.Input =
    require('./lib/transaction/input').createInputClasses(Networks);
  Transaction.Output =
    require('./lib/transaction/output').createOutputClass(Networks);
  Transaction.UnspentOutput =
    require('./lib/transaction/unspentoutput').createUnspentOutputClass(
      Networks
    );
  Transaction.Signature =
    require('./lib/transaction/signature').createTransactionSignatureClass(
      Networks
    );

  var Payload =
    require('./lib/transaction/payload').createPayloadClass(Networks);
  Transaction.Payload = Payload;

  var cryptoNs = {
    BN: require('./lib/crypto/bn'),
    ECDSA: require('./lib/crypto/ecdsa'),
    Hash: hashRegistry,
    Random: require('./lib/crypto/random'),
    Point: require('./lib/crypto/point'),
    Signature: require('./lib/crypto/signature'),
    BLS: require('./lib/crypto/bls'),
  };
  cryptoNs.Signer = require('./lib/crypto/signer');

  var encodingNs = {
    Base58: require('./lib/encoding/base58'),
    Base58Check: require('./lib/encoding/base58check'),
    BufferReader: require('./lib/encoding/bufferreader'),
    BufferWriter: require('./lib/encoding/bufferwriter'),
    Varint: require('./lib/encoding/varint'),
  };

  var utilNs = {
    buffer: require('./lib/util/buffer'),
    js: require('./lib/util/js'),
    preconditions: require('./lib/util/preconditions'),
    bitarray: require('./lib/util/bitarray'),
    ip: require('./lib/util/ip'),
    isHashQuorumIndexRequired: require('./lib/util/isHashQuorumIndexRequired'),
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

    Unit: require('./lib/unit'),
    Mnemonic: require('./lib/mnemonic').createMnemonicClass(Networks),
    Opcode: require('./lib/opcode'),

    crypto: cryptoNs,
    encoding: encodingNs,
    util: utilNs,
    errors: require('./lib/errors'),
  };
};

/**
 * Creates a standalone, isolated hash-algorithm registry, independently of
 * any chain. See `lib/crypto/hash.js`.
 */
multichain.createHashRegistry = Hash.createHashRegistry;
