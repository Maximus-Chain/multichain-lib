/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var x11hash = require('@dashevo/x11-hash-js');

// Osmium is a Dash fork with X11 PoW. Source:
// https://github.com/osmium-labs/osmium/blob/master/src/chainparams.cpp
//
// Notable facts:
// - Livenet pubkeyhash prefix is 63 (0x3F), addresses start with 'S'.
// - Testnet pubkeyhash prefix is 125 (0x7D), addresses start with 's'.
// - xpub/xprv use the Bitcoin defaults (no DIP-14 256-bit variant).
// - The message magic kept upstream from Dash: "DarkCoin Signed Message:\n".
// - Livenet P2P magic spells "OSMI" (0x4F534D49 big-endian).
// - Testnet P2P magic spells "tOSM" (0x744F534D big-endian).
// - BIP44 coin type is 5 (livenet), 1 (testnet) — informational only.
module.exports = {
  name: 'osmium',

  messageMagic: 'DarkCoin Signed Message:\n',

  algorithms: {
    x11: function (buf) {
      return x11hash.digest(buf, 1, 1);
    },
  },

  livenet: {
    name: 'livenet',
    alias: ['mainnet'],
    pubkeyhash: 63,
    privatekey: 75,
    scripthash: 15,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x4f534d49,
    port: 9969,
    dnsSeeds: ['dnsseed.osmium.space'],
    messageMagic: 'DarkCoin Signed Message:\n',
    hashFunction: 'x11',
  },

  testnet: {
    name: 'testnet',
    pubkeyhash: 125,
    privatekey: 239,
    scripthash: 12,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    networkMagic: 0x744f534d,
    port: 19969,
    dnsSeeds: ['testnet-seed.osmium.space'],
    messageMagic: 'DarkCoin Signed Message:\n',
    hashFunction: 'x11',
  },
};