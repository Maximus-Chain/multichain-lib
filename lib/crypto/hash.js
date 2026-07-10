/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

const crypto = require('crypto');
var BufferUtil = require('../util/buffer');
var $ = require('../util/preconditions');
var RipeMd160 = require('ripemd160');

function sha1(buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('sha1').update(buf).digest();
}
sha1.blocksize = 512;

function sha256(buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('sha256').update(buf).digest();
}
sha256.blocksize = 512;

function sha256sha256(buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return sha256(sha256(buf));
}

function ripemd160(buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return new RipeMd160().update(buf).digest();
}

function sha256ripemd160(buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return ripemd160(sha256(buf));
}

function sha512(buf) {
  $.checkArgument(BufferUtil.isBuffer(buf));
  return crypto.createHash('sha512').update(buf).digest();
}
sha512.blocksize = 1024;

function hmac(hashf, data, key) {
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
}

function sha256hmac(data, key) {
  return hmac(sha256, data, key);
}

function sha512hmac(data, key) {
  return hmac(sha512, data, key);
}

/**
 * Pure, stateless hash functions shared safely across every chain: their
 * output never depends on any per-chain configuration, so there is nothing
 * to isolate here. Compare with `createHashRegistry()` below, which manages
 * per-chain, stateful algorithm registration (e.g. "x11").
 */
var Hash = {
  sha1: sha1,
  sha256: sha256,
  sha256sha256: sha256sha256,
  ripemd160: ripemd160,
  sha256ripemd160: sha256ripemd160,
  sha512: sha512,
  hmac: hmac,
  sha256hmac: sha256hmac,
  sha512hmac: sha512hmac,
};

/**
 * Creates an isolated hash registry: the pure functions above, plus a
 * per-instance map of named algorithms (e.g. "x11") that a chain config can
 * register without affecting any other registry instance or chain. This is
 * the only place in the library where a hash algorithm can be registered —
 * there is no shared/global registry.
 *
 * @returns {Object} a hash registry
 */
function createHashRegistry() {
  var algorithms = {};

  var registry = {
    sha1: sha1,
    sha256: sha256,
    sha256sha256: sha256sha256,
    ripemd160: ripemd160,
    sha256ripemd160: sha256ripemd160,
    sha512: sha512,
    hmac: hmac,
    sha256hmac: sha256hmac,
    sha512hmac: sha512hmac,
  };

  registry.register = function (name, fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Algorithm must be a function');
    }
    algorithms[name] = fn;
  };

  registry.get = function (name) {
    var fn = algorithms[name];
    if (!fn) {
      throw new Error('Unknown hash algorithm: ' + name);
    }
    return fn;
  };

  registry.list = function () {
    return Object.keys(algorithms);
  };

  // Long-form aliases, for readability at call sites.
  registry.registerAlgorithm = registry.register;
  registry.getAlgorithm = registry.get;
  registry.listAlgorithms = registry.list;

  registry.x11 = function (buf) {
    $.checkArgument(BufferUtil.isBuffer(buf));
    return Buffer.from(registry.get('x11')(buf));
  };

  registry.forNetwork = function (buf, network) {
    $.checkArgument(BufferUtil.isBuffer(buf));
    if (network && network.hashFunction) {
      if (typeof network.hashFunction === 'string') {
        return registry.get(network.hashFunction)(buf);
      }
      return network.hashFunction(buf);
    }
    return registry.x11(buf);
  };

  return registry;
}

Hash.createHashRegistry = createHashRegistry;

module.exports = Hash;
