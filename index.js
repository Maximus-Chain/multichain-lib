/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var bitcore = module.exports;

bitcore.version = 'v' + require('./package.json').version;
bitcore.versionGuard = function (version) {
  if (version !== undefined) {
    var message =
      'More than one instance of dashcore-lib found. ' +
      'Please make sure that you are not mixing instances of classes of the different versions of dashcore.';
    console.warn(message);
  }
};
bitcore.versionGuard(global._dashcore);
global._dashcore = bitcore.version;

bitcore.crypto = {};
bitcore.crypto.BN = require('./lib/crypto/bn');
bitcore.crypto.ECDSA = require('./lib/crypto/ecdsa');
bitcore.crypto.Hash = require('./lib/crypto/hash');
bitcore.crypto.Random = require('./lib/crypto/random');
bitcore.crypto.Point = require('./lib/crypto/point');
bitcore.crypto.Signature = require('./lib/crypto/signature');
bitcore.Signer = require('./lib/crypto/signer');

bitcore.encoding = {};
bitcore.encoding.Base58 = require('./lib/encoding/base58');
bitcore.encoding.Base58Check = require('./lib/encoding/base58check');
bitcore.encoding.BufferReader = require('./lib/encoding/bufferreader');
bitcore.encoding.BufferWriter = require('./lib/encoding/bufferwriter');
bitcore.encoding.Varint = require('./lib/encoding/varint');

bitcore.util = {};
bitcore.util.buffer = require('./lib/util/buffer');
bitcore.util.js = require('./lib/util/js');
bitcore.util.preconditions = require('./lib/util/preconditions');

bitcore.errors = require('./lib/errors');

bitcore.Opcode = require('./lib/opcode');

bitcore.Address = require('./lib/address');
bitcore.HDPrivateKey = require('./lib/hdprivatekey.js');
bitcore.HDPublicKey = require('./lib/hdpublickey.js');
bitcore.Networks = require('./lib/networks');
bitcore.PrivateKey = require('./lib/privatekey');
bitcore.PublicKey = require('./lib/publickey');
bitcore.Script = require('./lib/script');
bitcore.Transaction = require('./lib/transaction');
bitcore.Unit = require('./lib/unit');
bitcore.Message = require('./lib/message');
bitcore.Mnemonic = require('./lib/mnemonic');

bitcore.deps = {};
bitcore.deps.bnjs = require('bn.js');
bitcore.deps.bs58 = require('bs58');
bitcore.deps.Buffer = Buffer;
bitcore.deps.elliptic = require('elliptic');
bitcore.deps._ = require('lodash');

bitcore.Transaction.sighash = require('./lib/transaction/sighash');
