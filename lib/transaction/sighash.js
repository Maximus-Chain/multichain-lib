/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var Signature = require('../crypto/signature');
var BufferReader = require('../encoding/bufferreader');
var BufferWriter = require('../encoding/bufferwriter');
var BN = require('../crypto/bn');
var Hash = require('../crypto/hash');
var ECDSA = require('../crypto/ecdsa');
var $ = require('../util/preconditions');
var _ = require('lodash');

var SIGHASH_SINGLE_BUG =
  '0000000000000000000000000000000000000000000000000000000000000001';
var BITS_64_ON = 'ffffffffffffffff';

var sighashCache = new WeakMap();

/**
 * Creates a `{ sighash, sign, verify }` namespace bound to the given
 * `Networks` instance. `sha256sha256` (used to compute the sighash) is a
 * pure, stateless function shared across all chains — the only reason this
 * is a factory at all is that it needs a concrete, chain-bound `Script`/
 * `Output`/`Transaction`/`Input` to operate on.
 *
 * @param {Object} Networks - a `lib/networks.js` `createNetworks()` instance
 * @returns {Object} `{ sighash, sign, verify }`
 */
function createSighash(Networks) {
  if (sighashCache.has(Networks)) {
    return sighashCache.get(Networks);
  }

  var Script = require('../script/script').createScriptClass(Networks);
  var Output = require('./output').createOutputClass(Networks);

  /**
   * @function
   * Returns a buffer of length 32 bytes with the hash that needs to be signed
   * for OP_CHECKSIG.
   *
   * @name Signing.sighash
   * @param {Transaction} transaction the transaction to sign
   * @param {number} sighashType the type of the hash
   * @param {number} inputNumber the input index for the signature
   * @param {Script} subscript the script that will be signed
   */
  var sighash = function sighash(
    transaction,
    sighashType,
    inputNumber,
    subscript
  ) {
    var Transaction = require('./transaction').createTransactionClass(Networks);
    var Input = require('./input').createInputClasses(Networks);

    var i;
    // Copy transaction
    var txcopy = Transaction.shallowCopy(transaction);

    // Copy script
    subscript = new Script(subscript);
    subscript.removeCodeseparators();

    for (i = 0; i < txcopy.inputs.length; i++) {
      // Blank signatures for other inputs
      txcopy.inputs[i] = new Input(txcopy.inputs[i]).setScript(Script.empty());
    }

    txcopy.inputs[inputNumber] = new Input(txcopy.inputs[inputNumber]).setScript(
      subscript
    );

    if (
      (sighashType & 31) === Signature.SIGHASH_NONE ||
      (sighashType & 31) === Signature.SIGHASH_SINGLE
    ) {
      // clear all sequenceNumbers
      for (i = 0; i < txcopy.inputs.length; i++) {
        if (i !== inputNumber) {
          txcopy.inputs[i].sequenceNumber = 0;
        }
      }
    }

    if ((sighashType & 31) === Signature.SIGHASH_NONE) {
      txcopy.outputs = [];
    } else if ((sighashType & 31) === Signature.SIGHASH_SINGLE) {
      // The SIGHASH_SINGLE bug.
      // https://bitcointalk.org/index.php?topic=260595.0
      if (inputNumber >= txcopy.outputs.length) {
        return Buffer.from(SIGHASH_SINGLE_BUG, 'hex');
      }

      txcopy.outputs.length = inputNumber + 1;

      for (i = 0; i < inputNumber; i++) {
        txcopy.outputs[i] = new Output({
          satoshis: BN.fromBuffer(Buffer.from(BITS_64_ON, 'hex')),
          script: Script.empty(),
        });
      }
    }

    if (sighashType & Signature.SIGHASH_ANYONECANPAY) {
      txcopy.inputs = [txcopy.inputs[inputNumber]];
    }

    var buf = new BufferWriter()
      .write(txcopy.toBuffer())
      .writeInt32LE(sighashType)
      .toBuffer();
    var ret = Hash.sha256sha256(buf);
    ret = new BufferReader(ret).readReverse();
    return ret;
  };

  /**
   * Create a signature
   *
   * @function
   * @name Signing.sign
   * @param {Transaction} transaction
   * @param {PrivateKey} privateKey
   * @param {number} sighash
   * @param {number} inputIndex
   * @param {Script} subscript
   * @return {Signature}
   */
  function sign(transaction, privateKey, sighashType, inputIndex, subscript) {
    var hashbuf = sighash(transaction, sighashType, inputIndex, subscript);
    var sig = ECDSA.sign(hashbuf, privateKey, 'little').set({
      nhashtype: sighashType,
    });
    return sig;
  }

  /**
   * Verify a signature
   *
   * @function
   * @name Signing.verify
   * @param {Transaction} transaction
   * @param {Signature} signature
   * @param {PublicKey} publicKey
   * @param {number} inputIndex
   * @param {Script} subscript
   * @return {boolean}
   */
  function verify(transaction, signature, publicKey, inputIndex, subscript) {
    $.checkArgument(!_.isUndefined(transaction));
    $.checkArgument(
      !_.isUndefined(signature) && !_.isUndefined(signature.nhashtype)
    );
    var hashbuf = sighash(
      transaction,
      signature.nhashtype,
      inputIndex,
      subscript
    );
    return ECDSA.verify(hashbuf, signature, publicKey, 'little');
  }

  /**
   * @namespace Signing
   */
  var namespace = {
    sighash: sighash,
    sign: sign,
    verify: verify,
  };

  sighashCache.set(Networks, namespace);

  return namespace;
}

module.exports = { createSighash: createSighash };
