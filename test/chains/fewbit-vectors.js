/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

require('chai').should();

var multichain = require('../../');
var fewbit = multichain.create('fewbit');

// Fewbit livenet BIP44 baseline vectors.
// Mnemonic + derivation path + expected xpub/address generated against
// Fewbit Core-Wallet (https://github.com/fewbit-network/Core-Wallet).
// Coin type 200 is the Fewbit BIP44 coin type for livenet.
//
// Related coverage already in the suite:
//   * BIP32 vector 1 + vector 2 (mnemonic-free BIP32): test/hdkeys.js
//   * Fewbit network constant assertions: test/chains/fewbit.js

var FEWBIT_LIVENET_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
var FEWBIT_LIVENET_BIP44_PATH = "m/44'/200'/0'";
var FEWBIT_LIVENET_BIP44_XPUB =
  'xpub6ByAYSDxTGNYMr6J7JPE3WUhRMRBLJoYXfdMPiqqve61qCfJQT6bTC57Luq82ZEnicWD5dDc7Fjm1ynhTYeJMv3WDXxDMK8886T64wWPf9N';
var FEWBIT_LIVENET_BIP44_ADDRESS =
  'F6zhkynSRAHxCyiB3BYwZNGSRTiRtgtAzp';

function fewbitSeed(mnemonic, network) {
  return fewbit.HDPrivateKey.fromSeed(
    new fewbit.Mnemonic(mnemonic).toSeed(),
    network
  );
}

describe('Fewbit livenet BIP44 baseline', function () {
  it('derives the expected xpub at m/44\'/200\'/0\'', function () {
    var xpub = fewbitSeed(FEWBIT_LIVENET_MNEMONIC, 'livenet')
      .derive(FEWBIT_LIVENET_BIP44_PATH)
      .hdPublicKey.xpubkey;
    xpub.should.equal(FEWBIT_LIVENET_BIP44_XPUB);
  });

  it('derives the expected address at m/44\'/200\'/0\'/0/0', function () {
    var address = fewbitSeed(FEWBIT_LIVENET_MNEMONIC, 'livenet')
      .derive(FEWBIT_LIVENET_BIP44_PATH + '/0/0')
      .privateKey.toAddress()
      .toString();
    address.should.equal(FEWBIT_LIVENET_BIP44_ADDRESS);
  });

  it('xpub round-trips through HDPublicKey.fromString', function () {
    var derived = fewbitSeed(FEWBIT_LIVENET_MNEMONIC, 'livenet').derive(
      FEWBIT_LIVENET_BIP44_PATH
    );
    var xpub = derived.hdPublicKey.xpubkey;

    var restored = fewbit.HDPublicKey.fromString(xpub);
    restored.xpubkey.should.equal(xpub);
    restored.network.name.should.equal('livenet');
  });

  it('derived address belongs to the fewbit livenet network', function () {
    var address = fewbitSeed(FEWBIT_LIVENET_MNEMONIC, 'livenet')
      .derive(FEWBIT_LIVENET_BIP44_PATH + '/0/0')
      .privateKey.toAddress();

    address.network.name.should.equal('livenet');
    fewbit.Address.isValid(address.toString(), 'livenet').should.equal(true);
    address.toString().charAt(0).should.equal('F');
  });
});
