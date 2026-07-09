/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

const crypto = require('crypto');
var BufferUtil = require('../util/buffer');
var $ = require('../util/preconditions');
var RipeMd160 = require('ripemd160');

var Hash = module.exports;

var algorithms = {};

Hash.registerAlgorithm = function (name, fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Algorithm must be a function');
  }
  algorithms[name] = fn;
};

Hash.getAlgorithm = function (name) {
  var fn = algorithms[name];
  if (!fn) {
    throw new Error('Unknown hash algorithm: ' + name);
  }
  return fn;
};

Hash.listAlgorithms = function () {
  return Object.keys(algorithms);
};

Hash.x11 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  var hash = Hash.getAlgorithm('x11')(buf);
  return Buffer.from(hash);
};

Hash.sha1 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('sha1').update(buf).digest();
};

Hash.sha1.blocksize = 512;

Hash.sha256 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('sha256').update(buf).digest();
};

Hash.sha256.blocksize = 512;

Hash.sha256sha256 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return Hash.sha256(Hash.sha256(buf));
};

Hash.ripemd160 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return new RipeMd160().update(buf).digest();
};

Hash.sha256ripemd160 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return Hash.ripemd160(Hash.sha256(buf));
};

Hash.sha512 = function (buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('sha512').update(buf).digest();
};

Hash.sha512.blocksize = 1024;

Hash.hmac = function (hashf, data, key) {
  //http://en.wikipedia.org/wiki/Hash-based_message_authentication_code
  //http://tools.ietf.org/html/rfc4868#section-2
  $.checkArgument(BufferUtil.isBuffer(data));
  $.checkArgument(BufferUtil.isBuffer(key));
  $.checkArgument(hashf.blocksize);

  var blocksize = hashf.blocksize / 8;

  if (key.length > blocksize) {
    key = hashf(key);
  } else if (key < blocksize) {
    var fill = Buffer.alloc(blocksize);
    fill.fill(0);
    key.copy(fill);
    key = fill;
  }

  var o_key = Buffer.alloc(blocksize);
  o_key.fill(0x5c);

  var i_key = Buffer.alloc(blocksize);
  i_key.fill(0x36);

  var o_key_pad = Buffer.alloc(blocksize);
  var i_key_pad = Buffer.alloc(blocksize);
  for (var i = 0; i < blocksize; i++) {
    o_key_pad[i] = o_key[i] ^ key[i];
    i_key_pad[i] = i_key[i] ^ key[i];
  }

  return hashf(
    Buffer.concat([o_key_pad, hashf(Buffer.concat([i_key_pad, data]))])
  );
};

Hash.sha256hmac = function (data, key) {
  return Hash.hmac(Hash.sha256, data, key);
};

Hash.sha512hmac = function (data, key) {
  return Hash.hmac(Hash.sha512, data, key);
};

Hash.forNetwork = function (buf, network) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  if (network && network.hashFunction) {
    if (typeof network.hashFunction === 'string') {
      return Hash.getAlgorithm(network.hashFunction)(buf);
    }
    return network.hashFunction(buf);
  }
  return Hash.x11(buf);
};