/* eslint-disable */
'use strict';

require('chai').should();
var expect = require('chai').expect;

var multichain = require('../../');

describe('multichain.create', function () {
  it('throws for an unknown chain name', function () {
    expect(function () {
      multichain.create('does-not-exist');
    }).to.throw(/Unknown chain/);
  });

  it('returns a ChainLib exposing the expected shape', function () {
    var maximus = multichain.create('maximus');

    maximus.should.have.property('Networks');
    maximus.should.have.property('chainName', 'maximus');
    maximus.should.have.property('Address');
    maximus.should.have.property('Script');
    maximus.should.have.property('HDPublicKey');
    maximus.should.have.property('HDPrivateKey');
    maximus.should.have.property('PrivateKey');
    maximus.should.have.property('PublicKey');
    maximus.should.have.property('Message');
    maximus.should.have.property('Transaction');
    maximus.should.have.property('ProRegTxPayload');
    maximus.should.have.property('Unit');
    maximus.should.have.property('Mnemonic');
    maximus.should.have.property('Opcode');
    maximus.should.have.property('crypto');
    maximus.should.have.property('encoding');
    maximus.should.have.property('util');
    maximus.should.have.property('errors');
  });

  it('two calls for the same chain return independent Networks/classes', function () {
    var a = multichain.create('maximus');
    var b = multichain.create('maximus');

    a.Networks.should.not.equal(b.Networks);
    a.Address.should.not.equal(b.Address);

    // but each instance is internally self-consistent
    var addr = new a.PrivateKey('livenet').toAddress();
    (addr instanceof a.Address).should.equal(true);
  });
});
