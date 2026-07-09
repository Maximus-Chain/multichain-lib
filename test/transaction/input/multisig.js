/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';
/* jshint unused: false */

var should = require('chai').should();
var expect = require('chai').expect;
var _ = require('lodash');

var bitcore = require('../../../index.js');
var Transaction = bitcore.Transaction;
var PrivateKey = bitcore.PrivateKey;
var Address = bitcore.Address;
var Script = bitcore.Script;
var Signature = bitcore.crypto.Signature;
var MultiSigInput = bitcore.Transaction.Input.MultiSig;

describe('MultiSigInput', function () {
  var privateKey1 = new PrivateKey(
    'CCgYWmj4bAGjZQzoxSJXMEr3UY59GpsXkWCsBgmdz7Vv6DX6xBAe'
  );
  var privateKey2 = new PrivateKey(
    'C77vTzXwCSQinX5yk5FE614hkJbAfKheMjzqJwrL5dV5jVNUHbXh'
  );
  var privateKey3 = new PrivateKey(
    'CB5N8mopsoaxscB4cF52YxCnDy5MjT3WpbFjWFGKAGAKtAMYZX6R'
  );
  var public1 = privateKey1.publicKey;
  var public2 = privateKey2.publicKey;
  var public3 = privateKey3.publicKey;
  var address = new Address('39tFCJArd6x5sPZMnTigdjHtb1yabX9n25');

  var output = {
    txId: '66e64ef8a3b384164b78453fa8c8194de9a473ba14f89485a0e433699daec140',
    outputIndex: 0,
    script: new Script(
      '52210234b264af1324252c52aa08de8e4897d9372babb1d08fa1d5ee1c7dd45b673aa9210398dd5418b47f734d5b15441296853272705233eadfc2c17b20453af57f46edea2103b85e3ffee38f3b33952b9b2bf44f716d546f313f0a29f352506fd038022fd5b653ae'
    ),
    satoshis: 1000000,
  };
  it('can count missing signatures', function () {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];

    input.countSignatures().should.equal(0);

    transaction.sign(privateKey1);
    input.countSignatures().should.equal(1);
    input.countMissingSignatures().should.equal(1);
    input.isFullySigned().should.equal(false);

    transaction.sign(privateKey2);
    input.countSignatures().should.equal(2);
    input.countMissingSignatures().should.equal(0);
    input.isFullySigned().should.equal(true);
  });
  it('can count missing signatures, signed with key 3 and 1', function () {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];

    input.countSignatures().should.equal(0);

    transaction.sign(privateKey3);
    input.countSignatures().should.equal(1);
    input.countMissingSignatures().should.equal(1);
    input.isFullySigned().should.equal(false);

    transaction.sign(privateKey1);
    input.countSignatures().should.equal(2);
    input.countMissingSignatures().should.equal(0);
    input.isFullySigned().should.equal(true);
  });
  it('returns a list of public keys with missing signatures', function () {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];

    _.every(input.publicKeysWithoutSignature(), function (publicKeyMissing) {
      var serialized = publicKeyMissing.toString();
      return (
        serialized === public1.toString() ||
        serialized === public2.toString() ||
        serialized === public3.toString()
      );
    }).should.equal(true);
    transaction.sign(privateKey1);
    _.every(input.publicKeysWithoutSignature(), function (publicKeyMissing) {
      var serialized = publicKeyMissing.toString();
      return (
        serialized === public2.toString() || serialized === public3.toString()
      );
    }).should.equal(true);
  });
  it('can clear all signatures', function () {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000)
      .sign(privateKey1)
      .sign(privateKey2);

    var input = transaction.inputs[0];
    input.isFullySigned().should.equal(true);
    input.clearSignatures();
    input.isFullySigned().should.equal(false);
  });
  it('can estimate how heavy is the output going to be', function () {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];
    input._estimateSize().should.equal(147);
  });
  it('uses SIGHASH_ALL by default', function () {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];
    var sigs = input.getSignatures(transaction, privateKey1, 0);
    sigs[0].sigtype.should.equal(Signature.SIGHASH_ALL);
  });
  it('roundtrips to/from object', function () {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000)
      .sign(privateKey1);
    var input = transaction.inputs[0];
    var roundtrip = new MultiSigInput(input.toObject());
    roundtrip.toObject().should.deep.equal(input.toObject());
  });
  it('roundtrips to/from object when not signed', function () {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];
    var roundtrip = new MultiSigInput(input.toObject());
    roundtrip.toObject().should.deep.equal(input.toObject());
  });
  it('can parse list of signature buffers, from TX signed with key 1 and 2', function () {
    var transaction = new Transaction(
      '030000000140c1ae9d6933e4a08594f814ba73a4e94d19c8a83f45784b1684b3a3f84ee666000000009300483045022100c0739575580a2e18033471d397de231643aaf64563ee2ce93d9db845a1b2ad9002207008948c5ccb2183cbaef27db2550dc9fa8c117f66899165b66e908c94afda8c01483045022100b114052fdcdeb337ced9f4de7b59609e748d01ea818c2281559ba23e12c6db3f02202595b4b7f2365ce7dd7c7122a51f11583cd63ce96822232cf99f74ac415dd3fb01ffffffff0140420f000000000017a91459e0a911ce0a7f96b97918309caa31cfea89627f8700000000'
    );

    var inputObj = transaction.inputs[0].toObject();
    inputObj.output = output;
    transaction.inputs[0] = new Transaction.Input(inputObj);

    inputObj.signatures = MultiSigInput.normalizeSignatures(
      transaction,
      transaction.inputs[0],
      0,
      transaction.inputs[0].script.chunks.slice(1).map(function (s) {
        return s.buf;
      }),
      [public1, public2, public3]
    );

    transaction.inputs[0] = new MultiSigInput(
      inputObj,
      [public1, public2, public3],
      2
    );

    transaction.inputs[0].signatures[0].publicKey.should.deep.equal(public1);
    transaction.inputs[0].signatures[1].publicKey.should.deep.equal(public2);
    should.equal(transaction.inputs[0].signatures[2], undefined);
    transaction.inputs[0].isValidSignature(
      transaction,
      transaction.inputs[0].signatures[0]
    ).should.be.true;
    transaction.inputs[0].isValidSignature(
      transaction,
      transaction.inputs[0].signatures[1]
    ).should.be.true;
  });
  it('can parse list of signature buffers, from TX signed with key 3 and 1', function () {
    var transaction = new Transaction(
      '030000000140c1ae9d6933e4a08594f814ba73a4e94d19c8a83f45784b1684b3a3f84ee66600000000920047304402207b5063edfe9953210e9e65f4625194cdc7c5cd5cfe4599acb42a80ba7132128902204043e85c40edf9efbbb8cdf07d3c921206aff404cdd2b98d947c3bba2345cb4d01483045022100b114052fdcdeb337ced9f4de7b59609e748d01ea818c2281559ba23e12c6db3f02202595b4b7f2365ce7dd7c7122a51f11583cd63ce96822232cf99f74ac415dd3fb01ffffffff0140420f000000000017a91459e0a911ce0a7f96b97918309caa31cfea89627f8700000000'
    );

    var inputObj = transaction.inputs[0].toObject();
    inputObj.output = output;
    transaction.inputs[0] = new Transaction.Input(inputObj);

    inputObj.signatures = MultiSigInput.normalizeSignatures(
      transaction,
      transaction.inputs[0],
      0,
      transaction.inputs[0].script.chunks.slice(1).map(function (s) {
        return s.buf;
      }),
      [public1, public2, public3]
    );

    transaction.inputs[0] = new MultiSigInput(
      inputObj,
      [public1, public2, public3],
      2
    );

    transaction.inputs[0].signatures[0].publicKey.should.deep.equal(public1);
    should.equal(transaction.inputs[0].signatures[1], undefined);
    transaction.inputs[0].signatures[2].publicKey.should.deep.equal(public3);
    transaction.inputs[0].isValidSignature(
      transaction,
      transaction.inputs[0].signatures[0]
    ).should.be.true;
    transaction.inputs[0].isValidSignature(
      transaction,
      transaction.inputs[0].signatures[2]
    ).should.be.true;
  });
});
