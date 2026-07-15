/* eslint-disable */
'use strict';

require('chai').should();
var expect = require('chai').expect;

var multichain = require('../../');
var proRegTxFixture = require('../fixtures/payload/proregtxpayload');

describe('cross-chain isolation: Transaction / ProRegTxPayload', function () {
  it('an isolated chain can parse and re-serialize the ProRegTxPayload fixture', function () {
    var maximus = multichain.create('maximus');

    var payload = maximus.ProRegTxPayload.fromBuffer(
      proRegTxFixture.getProRegPayloadBuffer()
    );

    expect(
      payload.toJSON({
        network: 'testnet',
        skipSignature: true,
      })
    ).to.be.deep.equal(proRegTxFixture.getProRegPayloadJSON());

    payload.toBuffer().toString('hex').should.equal(
      proRegTxFixture.getProRegPayloadHex()
    );
  });

  it('ProRegTxPayload instances are scoped to the chain that created them', function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    var payload = maximus.ProRegTxPayload.fromBuffer(
      proRegTxFixture.getProRegPayloadBuffer()
    );

    (payload instanceof maximus.ProRegTxPayload).should.equal(true);
    (payload instanceof osmium.ProRegTxPayload).should.equal(false);
  });

  it('Maximus advertises IPv6 service support on both networks', function () {
    var maximus = multichain.create('maximus');
    maximus.Networks.livenet.supportsIPv6.should.equal(true);
    maximus.Networks.testnet.supportsIPv6.should.equal(true);
  });

  it('Maximus accepts an IPv6 service string and round-trips the bytes', function () {
    var maximus = multichain.create('maximus');
    var json = proRegTxFixture.getProRegIPv6PayloadJSON();
    var payload = maximus.ProRegTxPayload.fromJSON(json);
    var buffer = payload.toBuffer();
    buffer.length.should.be.greaterThan(0);
    // Service+port occupy bytes [42..60) of the payload buffer (18 bytes).
    buffer
      .slice(42, 60)
      .toString('hex')
      .should.equal(proRegTxFixture.PROV6_SERVICE_HEX);

    var restored = maximus.ProRegTxPayload.fromBuffer(buffer);
    restored.service.should.equal(proRegTxFixture.getProRegIPv6Service());
  });

  it('Maximus still accepts an IPv4 service (legacy behavior)', function () {
    var maximus = multichain.create('maximus');
    var payload = maximus.ProRegTxPayload.fromJSON(
      proRegTxFixture.getProRegPayloadJSON()
    );
    payload.validate();
  });

  it('Osmium rejects an IPv6 service because supportsIPv6 is false', function () {
    var osmium = multichain.create('osmium');
    var json = proRegTxFixture.getProRegIPv6PayloadJSON();
    var Payload = osmium.ProRegTxPayload;
    var payload = Object.create(Payload.prototype);
    Object.assign(payload, json, {
      scriptPayout: new osmium.Script(
        new osmium.PrivateKey('testnet').toAddress()
      ).toHex(),
      payloadSig: undefined,
      payloadSigSize: 0,
    });
    (function () {
      payload.validate();
    }).should.throw(
      'Expected service to be a string with ip address and port'
    );
  });

  it('Osmium still accepts an IPv4 service (legacy behavior)', function () {
    var osmium = multichain.create('osmium');
    var json = proRegTxFixture.getProRegPayloadJSON();
    var Payload = osmium.ProRegTxPayload;
    var payload = Object.create(Payload.prototype);
    Object.assign(payload, json, {
      scriptPayout: new osmium.Script(
        new osmium.PrivateKey('testnet').toAddress()
      ).toHex(),
      payloadSig: undefined,
      payloadSigSize: 0,
    });
    payload.validate();
  });

  it('two isolated chains compute the same transaction hash for the same bytes', function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    var maximusTx = new maximus.Transaction(
      proRegTxFixture.getProRegTransactionHex()
    );
    var osmiumTx = new osmium.Transaction(
      proRegTxFixture.getProRegTransactionHex()
    );

    // sha256sha256 is stateless, so the computed transaction hash matches
    // across chains even though the classes themselves are isolated.
    maximusTx.hash.should.equal(osmiumTx.hash);
    (maximusTx instanceof maximus.Transaction).should.equal(true);
    (maximusTx instanceof osmium.Transaction).should.equal(false);
  });
});
