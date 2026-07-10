/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

var Hash = require('../../crypto/hash');
var Signer = require('../../crypto/signer');

/**
 * @constructor
 */
function AbstractPayload() {}

/**
 *
 * @param [options]
 * @param {Boolean} options.skipSignature - skip signature when serializing. Needed for signing payload
 * @return {Buffer}
 */
AbstractPayload.prototype.toBuffer = function (options) {
  throw new Error('Not implemented');
};

/**
 * @param [options]
 * @param {Boolean} options.skipSignature - skip signature when serializing. Needed for signing payload
 * @return {Object}
 */
AbstractPayload.prototype.toJSON = function (options) {
  throw new Error('Not implemented');
};

/**
 * @param [options]
 * @param {Boolean} options.skipSignature - skip signature when serializing. Needed for signing payload
 * @return {string}
 */
AbstractPayload.prototype.toString = function (options) {
  return this.toBuffer().toString('hex');
};

/**
 * @param [options]
 * @param {Boolean} options.skipSignature - skip signature when serializing. Needed for signing payload
 * @return {Buffer} - hash
 */
AbstractPayload.prototype.getHash = function (options) {
  return Hash.sha256sha256(this.toBuffer(options));
};

/**
 * Signs payload
 * @param {string|PrivateKey} privateKey
 * @return {AbstractPayload}
 */
AbstractPayload.prototype.sign = function (privateKey) {
  var payloadHash = this.getHash({ skipSignature: true });
  var signatureBuffer = Signer.signHash(payloadHash, privateKey);
  this.payloadSig = signatureBuffer.toString('hex');
  this.payloadSigSize = this.payloadSig.length / 2;
  return this;
};

/**
 * Verify payload signature
 * @param {string|Buffer} publicKeyId
 * @param {Function=} PublicKeyClass - the `PublicKey` class of the chain this
 *   payload belongs to, used to reconstruct the signer's public key from the
 *   raw signature. Concrete payload classes bound to a chain (e.g.
 *   `ProRegTxPayload`) supply this automatically; pass it explicitly when
 *   calling this method directly on a chain-agnostic `AbstractPayload`.
 * @return {boolean}
 */
AbstractPayload.prototype.verifySignature = function (
  publicKeyId,
  PublicKeyClass
) {
  var payloadHash = this.getHash({ skipSignature: true });
  var signatureBuffer = Buffer.from(this.payloadSig, 'hex');
  return Signer.verifyHashSignature(
    payloadHash,
    signatureBuffer,
    publicKeyId,
    PublicKeyClass
  );
};

module.exports = AbstractPayload;
