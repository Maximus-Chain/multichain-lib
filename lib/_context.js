/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var currentNetworks = null;
var currentChainName = null;

module.exports = {
  set: function (networks, chainName) {
    currentNetworks = networks;
    currentChainName = chainName;
  },
  get: function () {
    if (!currentNetworks) {
      throw new Error(
        'No chain configured. Call multichain.create("chainName") first.'
      );
    }
    return currentNetworks;
  },
  getChainName: function () {
    return currentChainName;
  },
  reset: function () {
    currentNetworks = null;
    currentChainName = null;
  },
};