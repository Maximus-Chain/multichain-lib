/* eslint-disable */
'use strict';

require('chai').should();

var multichain = require('../../');

describe('cross-chain isolation: Transaction inputs/outputs', function () {
  it('builds a P2PKH-spending transaction independently on two isolated chains', function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    [maximus, osmium].forEach(function (chain) {
      var privateKey = new chain.PrivateKey('livenet');
      var address = privateKey.toAddress();

      var utxo = {
        txId: '0000000000000000000000000000000000000000000000000000000000000001',
        outputIndex: 0,
        address: address.toString(),
        script: chain.Script.buildPublicKeyHashOut(address).toHex(),
        satoshis: 100000,
      };

      var tx = new chain.Transaction()
        .from(utxo)
        .to(new chain.PrivateKey('livenet').toAddress(), 50000)
        .change(address)
        .sign(privateKey);

      tx.isFullySigned().should.equal(true);
      (tx.inputs[0] instanceof chain.Transaction.Input.PublicKeyHash).should.equal(
        true
      );
    });
  });

  it("an isolated chain's Input/Output classes are not shared with another chain", function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    (
      maximus.Transaction.Input.PublicKeyHash ===
      osmium.Transaction.Input.PublicKeyHash
    ).should.equal(false);
    (maximus.Transaction.Output === osmium.Transaction.Output).should.equal(
      false
    );
  });
});
