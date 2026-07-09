/* eslint-disable */
// Regression test for: ensure Signature.toCompact() always emits 65-byte
// output regardless of bn.js padding behavior. CI previously hit a flaky
// failure because BN.toBuffer({size: 32}) does not always pad to exactly
// 32 bytes; this test exercises the signer enough times to detect any
// regression in compact-signature length stability.

require('chai').should();

var Signer = require('../_setup').crypto.Signer;
var Signature = require('../_setup').crypto.Signature;
var PrivateKey = require('../_setup').PrivateKey;

describe('Signature.toCompact length stability', function () {
  it('should always produce a 65-byte buffer across many random keys', function () {
    var failures = [];
    for (var i = 0; i < 100; i++) {
      var pk = new PrivateKey();
      var sig = Signer.sign(Buffer.from('test data ' + i), pk);
      if (sig.length !== 65) {
        failures.push({ iteration: i, length: sig.length });
      }
    }
    if (failures.length > 0) {
      throw new Error(
        'toCompact produced non-65-byte output on ' +
          failures.length +
          ' of 100 iterations. First failure: ' +
          JSON.stringify(failures[0])
      );
    }
  });

  it('should produce a round-trippable compact signature', function () {
    for (var i = 0; i < 100; i++) {
      var pk = new PrivateKey();
      var data = Buffer.from('round trip ' + i);
      var compact = Signer.sign(data, pk);
      compact.length.should.equal(65);
      var parsed = Signature.fromCompact(compact);
      parsed.r.toBuffer().length.should.be.at.most(32);
      parsed.s.toBuffer().length.should.be.at.most(32);
    }
  });

  it('should verify signatures produced for random keys', function () {
    for (var i = 0; i < 100; i++) {
      var pk = new PrivateKey();
      var data = Buffer.from('verify ' + i);
      var sig = Signer.sign(data, pk);
      var verified = Signer.verifySignature(data, sig, pk.toPublicKey());
      verified.should.equal(true);
    }
  });
});