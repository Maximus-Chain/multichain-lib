/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

module.exports = {
  name: 'filopow',

  messageMagic: 'Filopow Signed Message:\n',

  livenet: {
    name: 'livenet',
    alias: ['mainnet', 'filopow'],
    pubkeyhash: 36,
    privatekey: 128,
    scripthash: 95,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x46504f57,
    port: 7767,
    dnsSeeds: [
      'seed1.filopow.xyz',
      'seed2.filopow.xyz',
      'seed3.filopow.xyz',
    ],
    messageMagic: 'Filopow Signed Message:\n',
  },

  testnet: {
    name: 'testnet',
    pubkeyhash: 111,
    privatekey: 239,
    scripthash: 196,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    networkMagic: 0x66706f77,
    port: 17767,
    dnsSeeds: [],
    messageMagic: 'Filopow Signed Message:\n',
  },
};