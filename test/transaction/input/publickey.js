/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var should = require('chai').should();
var bitcore = require('../../../index.js');
var Transaction = bitcore.Transaction;
var PrivateKey = bitcore.PrivateKey;

describe('PublicKeyInput', function () {
  var utxo = {
    txid: '7f3b688cb224ed83e12d9454145c26ac913687086a0a62f2ae0bc10934a4030f',
    vout: 0,
    address: 'mXKsrF49ugsGMdzqJtNmGTmvdL2F5U7RWG',
    scriptPubKey: '76a914a626b527c6a0162d8b484cc4014780ead9d088af88ac',
    amount: 50,
    confirmations: 104,
    spendable: true,
  };
  var privateKey = PrivateKey.fromWIF(
    'cSDDUYQDinRZYQNAuYrukcSM3Lk1P8TkcPT7nzJdVbHx61W7FiTa'
  );
  var address = privateKey.toAddress();
  utxo.address.should.equal(address.toString());

  var destKey = new PrivateKey();

  it('will correctly sign a publickey out transaction', function () {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    tx.sign(privateKey);
    tx.inputs[0].script.toBuffer().length.should.be.above(0);
  });

  it('count can count missing signatures', function () {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    input.isFullySigned().should.equal(false);
    tx.sign(privateKey);
    input.isFullySigned().should.equal(true);
  });

  it("it's size can be estimated", function () {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    input._estimateSize().should.equal(107);
  });

  it("it's signature can be removed", function () {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    tx.sign(privateKey);
    input.isFullySigned().should.equal(true);
    input.clearSignatures();
    input.isFullySigned().should.equal(false);
  });

  it('returns an empty array if private key mismatches', function () {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    var signatures = input.getSignatures(tx, new PrivateKey(), 0);
    signatures.length.should.equal(0);
  });
});
