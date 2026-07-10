/* eslint-disable */
'use strict';

require('chai').should();

var multichain = require('../../');

function tick() {
  return new Promise(function (resolve) {
    setImmediate(resolve);
  });
}

describe('cross-chain isolation: Address', function () {
  it('Address.isValid only accepts addresses from its own chain', function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    var maximusAddress = new maximus.PrivateKey('livenet').toAddress().toString();
    var osmiumAddress = new osmium.PrivateKey('livenet').toAddress().toString();

    maximusAddress.charAt(0).should.not.equal(osmiumAddress.charAt(0));

    maximus.Address.isValid(maximusAddress, 'livenet').should.equal(true);
    osmium.Address.isValid(osmiumAddress, 'livenet').should.equal(true);

    // an address from one chain is not a valid address on the other
    maximus.Address.isValid(osmiumAddress, 'livenet').should.equal(false);
    osmium.Address.isValid(maximusAddress, 'livenet').should.equal(false);
  });

  it('is safe under interleaved awaits between two concurrently-used chains', async function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    var maximusPk = new maximus.PrivateKey('livenet');
    await tick();
    var osmiumPk = new osmium.PrivateKey('livenet');
    await tick();

    var maximusAddress = maximusPk.toAddress().toString();
    await tick();
    var osmiumAddress = osmiumPk.toAddress().toString();

    // Even though the two chains' construction was interleaved with awaits,
    // each chain's Address class still validates only its own addresses.
    maximus.Address.isValid(maximusAddress, 'livenet').should.equal(true);
    maximus.Address.isValid(osmiumAddress, 'livenet').should.equal(false);
    osmium.Address.isValid(osmiumAddress, 'livenet').should.equal(true);
    osmium.Address.isValid(maximusAddress, 'livenet').should.equal(false);
  });

  it('Script <-> Address round-trip stays within the same isolated chain', function () {
    var maximus = multichain.create('maximus');
    var osmium = multichain.create('osmium');

    var maximusAddress = new maximus.PrivateKey('livenet').toAddress();
    var script = maximus.Script.buildPublicKeyHashOut(maximusAddress);
    var roundTripped = script.toAddress();

    roundTripped.toString().should.equal(maximusAddress.toString());
    (roundTripped instanceof maximus.Address).should.equal(true);
    (roundTripped instanceof osmium.Address).should.equal(false);
  });
});
