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

multichain.registerAlgorithm = Hash.registerAlgorithm;
multichain.algorithms = Hash.listAlgorithms;

var createNetworks = require('./lib/networks').create;
var context = require('./lib/_context');

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

  if (config.algorithms) {
    Object.keys(config.algorithms).forEach(function (name) {
      Hash.registerAlgorithm(name, config.algorithms[name]);
    });
  }

  var Networks = createNetworks();
  Networks.add(config.livenet);
  Networks.add(config.testnet, {
    noStaticNetworkMagic: true,
    noStaticPort: true,
    noStaticDnsSeeds: true,
  });
  Networks.setActive('livenet');

  context.set(Networks, chainName);

  var cryptoNs = {
    BN: require('./lib/crypto/bn'),
    ECDSA: require('./lib/crypto/ecdsa'),
    Hash: require('./lib/crypto/hash'),
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

    Address: require('./lib/address'),
    HDPrivateKey: require('./lib/hdprivatekey'),
    HDPublicKey: require('./lib/hdpublickey'),
    PrivateKey: require('./lib/privatekey'),
    PublicKey: require('./lib/publickey'),
    Script: require('./lib/script'),
    Transaction: (function () {
      var T = require('./lib/transaction');
      if (!T.sighash) T.sighash = require('./lib/transaction/sighash');
      return T;
    })(),
    Unit: require('./lib/unit'),
    Message: require('./lib/message'),
    Mnemonic: require('./lib/mnemonic'),
    Opcode: require('./lib/opcode'),

    crypto: cryptoNs,
    encoding: encodingNs,
    util: utilNs,
    errors: require('./lib/errors'),
  };
};