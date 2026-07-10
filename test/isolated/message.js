/* eslint-disable */
'use strict';

require('chai').should();

var multichain = require('../../');

// Built-in chains (maximus/osmium) happen to share the same message magic, so
// to prove per-chain isolation of Message._getMagicBytes (the default-active-
// network fallback that used to read the global `lib/_context.js` singleton)
// we register two throwaway chains that differ only in messageMagic.
multichain.registerChain('isolated-test-chain-a', {
  livenet: {
    name: 'livenet',
    pubkeyhash: 0x32,
    privatekey: 0x4b,
    scripthash: 0x05,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    messageMagic: 'ChainA Signed Message:\n',
  },
  testnet: {
    name: 'testnet',
    pubkeyhash: 0x6e,
    privatekey: 0xef,
    scripthash: 0x0c,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    messageMagic: 'ChainA Signed Message:\n',
  },
});

multichain.registerChain('isolated-test-chain-b', {
  livenet: {
    name: 'livenet',
    pubkeyhash: 0x32,
    privatekey: 0x4b,
    scripthash: 0x05,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    messageMagic: 'ChainB Signed Message:\n',
  },
  testnet: {
    name: 'testnet',
    pubkeyhash: 0x6e,
    privatekey: 0xef,
    scripthash: 0x0c,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    messageMagic: 'ChainB Signed Message:\n',
  },
});

describe('cross-chain isolation: Message', function () {
  it("each isolated chain's default message magic reflects only its own active network", function () {
    var chainA = multichain.create('isolated-test-chain-a');
    var chainB = multichain.create('isolated-test-chain-b');

    chainA.Message._getMagicBytes()
      .toString()
      .should.equal('ChainA Signed Message:\n');
    chainB.Message._getMagicBytes()
      .toString()
      .should.equal('ChainB Signed Message:\n');
  });

  it('signs and verifies a message round-trip within a single isolated chain', function () {
    var chainA = multichain.create('isolated-test-chain-a');

    var pk = new chainA.PrivateKey('livenet');
    var msg = new chainA.Message('hello isolated chain a');
    var sig = msg.sign(pk);

    msg.verify(pk.toAddress(), sig).should.equal(true);
  });
});
