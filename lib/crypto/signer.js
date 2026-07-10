/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

var Signature = require('./signature');
var ECDSA = require('./ecdsa');
var doubleSha = require('./hash').sha256sha256;

/**
 * @param {Buffer} data
 * @param {PrivateKey} privateKey - an instance of a chain's bound `PrivateKey`
 *   class (there is no default `PrivateKey` class to construct one from a
 *   string; construct it with the chain's own `PrivateKey` first).
 * @return {Buffer}
 */
function sign(data, privateKey) {
  var hash = doubleSha(data);
  return signHash(hash, privateKey);
}

/**
 * Sign hash.
 * @param {Buffer} hash
 * @param {PrivateKey} privateKey - an instance of a chain's bound `PrivateKey`
 *   class.
 * @return {Buffer} - 65-bit compact signature
 */
function signHash(hash, privateKey) {
  var ecdsa = new ECDSA();
  ecdsa.hashbuf = hash;
  ecdsa.privkey = privateKey;
  ecdsa.pubkey = privateKey.toPublicKey();
  ecdsa.signRandomK();
  ecdsa.calci();
  return ecdsa.sig.toCompact();
}

/**
 * Verifies hash signature against public key id
 * @param {Buffer} hash
 * @param {Buffer} dataSignature
 * @param {Buffer|string} publicKeyId
 * @param {Function} PublicKeyClass - the chain's bound `PublicKey` class,
 *   used to reconstruct the signer's public key from the raw signature.
 * @return {boolean}
 */
function verifyHashSignature(hash, dataSignature, publicKeyId, PublicKeyClass) {
  var signature = Signature.fromCompact(dataSignature);
  var extractedPublicKey = new ECDSA({
    hashbuf: hash,
    sig: signature,
  }).toPublicKey(PublicKeyClass);
  var extractedPubKeyId = extractedPublicKey._getID();
  var pubKeyId = Buffer.from(publicKeyId, 'hex');

  return extractedPubKeyId.equals(pubKeyId);
}

/**
 * @param {Buffer} data
 * @param {Buffer} dataSignature - compact signature
 * @param {PublicKey} publicKey
 * @return {boolean}
 */
function verifyDataSignature(data, dataSignature, publicKey) {
  var hash = doubleSha(data);
  var signature = Signature.fromCompact(dataSignature);

  return ECDSA.verify(hash, signature, publicKey);
}

var signer = {
  sign: sign,
  verifySignature: verifyDataSignature,
  signHash: signHash,
  verifyHashSignature: verifyHashSignature,
};

module.exports = signer;
