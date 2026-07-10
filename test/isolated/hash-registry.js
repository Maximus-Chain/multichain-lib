/* eslint-disable */
'use strict';

require('chai').should();

var multichain = require('../../');

describe('cross-chain isolation: hash registry', function () {
  it('registering a custom algorithm on one registry does not leak into another', function () {
    var registryA = multichain.createHashRegistry();
    var registryB = multichain.createHashRegistry();

    registryA.register('x17', function (buf) {
      return Buffer.concat([buf, buf]);
    });

    registryA.list().should.include('x17');
    registryB.list().should.not.include('x17');

    (function () {
      registryB.getAlgorithm('x17');
    }).should.throw(/Unknown hash algorithm/);
  });

  it('each chain gets its own hash registry pre-loaded with its algorithms', function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    maximus.crypto.Hash.list().should.include('x11');
    osmium.crypto.Hash.list().should.include('x11');

    // Custom algorithms registered on one chain's registry do not leak into
    // another chain's registry — there is no shared/global registry anywhere.
    maximus.crypto.Hash.register('only-on-maximus', function (buf) {
      return buf;
    });
    maximus.crypto.Hash.list().should.include('only-on-maximus');
    osmium.crypto.Hash.list().should.not.include('only-on-maximus');
  });

  it('stateless hash functions (sha256, sha256sha256, ripemd160) behave identically across registries', function () {
    var registryA = multichain.createHashRegistry();
    var registryB = multichain.createHashRegistry();
    var buf = Buffer.from('multichain-lib isolation test', 'utf8');

    registryA.sha256sha256(buf).toString('hex').should.equal(
      registryB.sha256sha256(buf).toString('hex')
    );
    registryA.sha256ripemd160(buf).toString('hex').should.equal(
      registryB.sha256ripemd160(buf).toString('hex')
    );
  });
});
