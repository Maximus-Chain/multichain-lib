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
