/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var x11hash = require('@dashevo/x11-hash-js');

module.exports = {
  name: 'maximus',

  messageMagic: 'DarkCoin Signed Message:\n',

  algorithms: {
    x11: function (buf) {
      return x11hash.digest(buf, 1, 1);
    },
  },

  livenet: {
    name: 'livenet',
    alias: ['mainnet', 'maximus'],
    pubkeyhash: 0x32,
    privatekey: 0x4b,
    scripthash: 0x05,
    xpubkey: 0x488b21e,
    xprivkey: 0x488ade4,
    xpubkey256bit: 0x0eecefc5,
    xprivkey256bit: 0x0eecf02e,
    networkMagic: 0x4d415849,
    port: 9999,
    dnsSeeds: [
      'dnsseed.darkcoin.io',
      'dnsseed.dashdot.io',
      'dnsseed.masternode.io',
      'dnsseed.dashpay.io',
    ],
    messageMagic: 'DarkCoin Signed Message:\n',
    hashFunction: 'x11',
    supportsIPv6: true,
  },

  testnet: {
    name: 'testnet',
    alias: ['regtest', 'devnet', 'evonet', 'local'],
    pubkeyhash: 0x6e,
    privatekey: 0xef,
    scripthash: 0x0c,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    xpubkey256bit: 0x0eed270b,
    xprivkey256bit: 0x0eed2774,
    networkMagic: 0xcee2caff,
    port: 19999,
    dnsSeeds: [
      'testnet-seed.darkcoin.io',
      'testnet-seed.dashdot.io',
      'test.dnsseed.masternode.io',
    ],
    messageMagic: 'DarkCoin Signed Message:\n',
    hashFunction: 'x11',
    supportsIPv6: true,
  },
};