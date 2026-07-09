/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var _ = require('lodash');
// bs58 v6+ exports as default
var bs58 = require('bs58').default || require('bs58');

var ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('');

var Base58 = function Base58(obj) {
  /* jshint maxcomplexity: 8 */
  if (!(this instanceof Base58)) {
    return new Base58(obj);
  }
  if (Buffer.isBuffer(obj)) {
    var buf = obj;
    this.fromBuffer(buf);
  } else if (typeof obj === 'string') {
    var str = obj;
    this.fromString(str);
  } else if (obj) {
    this.set(obj);
  }
};

Base58.validCharacters = function validCharacters(chars) {
  if (Buffer.isBuffer(chars)) {
    chars = chars.toString();
  }
  return _.every(
    _.map(chars, function (char) {
      return _.includes(ALPHABET, char);
    })
  );
};

Base58.prototype.set = function (obj) {
  this.buf = obj.buf || this.buf || undefined;
  return this;
};

Base58.encode = function (buf) {
  if (!Buffer.isBuffer(buf)) {
    throw new Error('Input should be a buffer');
  }
  // bs58 v5+ requires Uint8Array, but also accepts Buffer
  return bs58.encode(buf);
};

Base58.decode = function (str) {
  if (typeof str !== 'string') {
    throw new Error('Input should be a string');
  }
  const decoded = bs58.decode(str);
  // bs58 v5+ returns Uint8Array, convert to Buffer
  return Buffer.from(decoded);
};

Base58.prototype.fromBuffer = function (buf) {
  this.buf = buf;
  return this;
};

Base58.prototype.fromString = function (str) {
  var buf = Base58.decode(str);
  this.buf = buf;
  return this;
};

Base58.prototype.toBuffer = function () {
  return this.buf;
};

Base58.prototype.toString = function () {
  return Base58.encode(this.buf);
};

module.exports = Base58;
