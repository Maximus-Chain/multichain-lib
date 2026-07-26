/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

// FewBit is a Dash fork (PoW: GhostRider, adapted from Raptoreum).
// Source: https://github.com/fewbit-network/Core-Wallet
//
// Notable facts:
// - Livenet pubkeyhash prefix is 35 (0x23), addresses start with 'F'.
// - Testnet pubkeyhash prefix is 95 (0x5F), addresses start with 'f'.
// - xpub/xprv use the Bitcoin defaults (no DIP-14 256-bit variant).
// - The message magic kept upstream from Dash:
//   "DarkCoin Signed Message:\n" (defined in src/validation.cpp).
// - Both livenet and testnet share the same P2P magic spelling "fbc."
//   (0x66 0x62 0x63 0x2e big-endian).
// - Default ports: 1155 (livenet), 11551 (testnet).
// - BIP44 coin type is 200 (livenet), 10227 (testnet) — informational only.
module.exports = {
  name: 'fewbit',

  messageMagic: 'DarkCoin Signed Message:\n',

  livenet: {
    name: 'livenet',
    alias: ['mainnet', 'fewbit'],
    pubkeyhash: 35,
    privatekey: 128,
    scripthash: 16,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x6662632e,
    port: 1155,
    dnsSeeds: [
      '89.168.20.232',
      '89.168.18.209',
      'explorer.fewbit.online',
      'fewbit.online',
    ],
    messageMagic: 'DarkCoin Signed Message:\n',
  },

  testnet: {
    name: 'testnet',
    pubkeyhash: 95,
    privatekey: 239,
    scripthash: 19,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    networkMagic: 0x6662632e,
    port: 11551,
    dnsSeeds: [],
    messageMagic: 'DarkCoin Signed Message:\n',
  },
};
