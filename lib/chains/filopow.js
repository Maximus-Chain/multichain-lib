/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

// FILOPOW is a Dash fork (PoW: KawPoW).
// Source: https://github.com/filoproject/filopow
//
// Notable facts:
// - Livenet pubkeyhash prefix is 36 (0x24), addresses start with 'F'.
// - Testnet pubkeyhash prefix is 111 (0x6F), addresses start with 'm'/'n'.
// - xpub/xprv use the Bitcoin defaults (no DIP-14 256-bit variant).
// - The message magic is "Filopow Signed Message:\n" (declared in
//   src/validation.cpp).
// - Both livenet and testnet share the message magic.
// - Default ports: 7767 (livenet), 17767 (testnet).
// - FILOPOW's `CProRegTx::CURRENT_VERSION` is `1` (see
//   filoproject/filopow `src/evo/providertx.h`). Dash's default is `2`,
//   which FILOPOW's `CheckProRegTx` rejects with `bad-protx-version`.
// - FILOPOW's `CheckProRegTx` rejects any payload with `type !== 0`
//   (`MASTERNODE_TYPE_BASIC`) and `mode !== 0`. Enabling the
//   `enforceMasternode*` flags below makes the lib fail fast in
//   `validate()` instead of producing an invalid wire payload.
module.exports = {
  name: 'filopow',

  messageMagic: 'Filopow Signed Message:\n',

  payloadVersions: {
    proRegTx: 1,
  },

  enforceMasternodeTypeBasic: true,
  enforceMasternodeModeBasic: true,

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