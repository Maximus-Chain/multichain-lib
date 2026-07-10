/* eslint-disable */
'use strict';

require('chai').should();

var multichain = require('../../');

describe('cross-chain isolation: HDPrivateKey / HDPublicKey', function () {
  it('instanceof checks stay scoped to the chain that created the key', function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    var maximusHd = new maximus.HDPrivateKey('livenet');
    var osmiumHd = new osmium.HDPrivateKey('livenet');

    (maximusHd instanceof maximus.HDPrivateKey).should.equal(true);
    (maximusHd instanceof osmium.HDPrivateKey).should.equal(false);
    (osmiumHd instanceof osmium.HDPrivateKey).should.equal(true);
    (osmiumHd instanceof maximus.HDPrivateKey).should.equal(false);

    var maximusHdPub = maximusHd.hdPublicKey;
    (maximusHdPub instanceof maximus.HDPublicKey).should.equal(true);
    (maximusHdPub instanceof osmium.HDPublicKey).should.equal(false);
  });

  it('round-trips a derived child key within the same isolated chain', function () {
    var maximus = multichain.create('maximus');

    var root = new maximus.HDPrivateKey('livenet');
    var child = root.derive("m/44'/5'/0'/0/0");
    var restored = new maximus.HDPrivateKey(child.toString());

    restored.xprivkey.should.equal(child.xprivkey);
    (restored.privateKey.toAddress() instanceof maximus.Address).should.equal(
      true
    );
  });

  it("derives an address whose prefix matches the chain's own pubkeyhash version", function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    var maximusAddress = new maximus.HDPrivateKey('livenet').privateKey
      .toAddress()
      .toString();
    var osmiumAddress = new osmium.HDPrivateKey('livenet').privateKey
      .toAddress()
      .toString();

    maximus.Address.isValid(maximusAddress, 'livenet').should.equal(true);
    osmium.Address.isValid(osmiumAddress, 'livenet').should.equal(true);
    // Maximus livenet pubkeyhash (0x32) vs Osmium livenet pubkeyhash (63)
    // produce addresses with different leading characters.
    osmiumAddress.charAt(0).should.equal('S');
  });
});
