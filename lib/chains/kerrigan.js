/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

// Kerrigan is a Dash fork (multi-algo PoW: X11, KawPoW, Equihash-200,9,
// Equihash-192,7; Sapling shielded txs; Evo "BroodNodes").
// Source: https://github.com/kerrigan-network/kerrigan (tag v1.3.2)
//
// Notable facts:
// - Livenet pubkeyhash prefix is 45 (0x2D), addresses start with 'K'.
// - Testnet pubkeyhash prefix is 107 (0x6B), addresses start with 'k'.
// - xpub/xprv use the Bitcoin defaults (no DIP-14 256-bit variant).
// - The message magic kept upstream from Dash:
//   "DarkCoin Signed Message:\n" (defined in src/util/message.cpp).
// - P2P magic spells "KRGN" (livenet) and "krgt" (testnet) big-endian.
// - Default ports: 7120 (livenet), 17120 (testnet).
// - BIP44 coin type is 99888 (livenet), 1 (testnet) — informational only.
// - ProRegTx follows Dash defaults (version 2 / BasicBLS, Regular or Evo
//   types): V24 extended addresses are NEVER_ACTIVE upstream, so no
//   `payloadVersions` override is needed.
// - Unlike Maximus / Osmium, Kerrigan Core still serializes the Evo
//   platform fields (platformNodeID + P2P / HTTP ports) in CProRegTx and
//   rejects an Evo ProRegTx without them (`bad-protx-platform-nodeid`),
//   hence `proRegTxPlatformFields: true`. On mainnet the ports must be
//   the chain defaults 7121 / 7122 (testnet 17121 / 17122).
// - Sapling shielded transactions (special tx type 10) are out of scope;
//   transparent transactions are standard Dash v2/v3.
module.exports = {
  name: 'kerrigan',

  messageMagic: 'DarkCoin Signed Message:\n',

  proRegTxPlatformFields: true,

  livenet: {
    name: 'livenet',
    alias: ['mainnet', 'kerrigan'],
    pubkeyhash: 45,
    privatekey: 204,
    scripthash: 16,
    xpubkey: 0x0488b21e,
    xprivkey: 0x0488ade4,
    networkMagic: 0x4b52474e,
    port: 7120,
    dnsSeeds: [
      'seed1.kerrigan.network',
      'seed2.kerrigan.network',
      'seed3.kerrigan.network',
      'seed4.kerrigan.network',
    ],
    messageMagic: 'DarkCoin Signed Message:\n',
  },

  testnet: {
    name: 'testnet',
    pubkeyhash: 107,
    privatekey: 239,
    scripthash: 19,
    xpubkey: 0x043587cf,
    xprivkey: 0x04358394,
    networkMagic: 0x6b726774,
    port: 17120,
    dnsSeeds: [],
    messageMagic: 'DarkCoin Signed Message:\n',
  },
};
