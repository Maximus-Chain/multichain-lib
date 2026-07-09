/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';
var _ = require('lodash');

var BufferUtil = require('./util/buffer');
var JSUtil = require('./util/js');
var networks = [];
var networkMaps = {};

var activeNetwork = null;

function Network() {}

Network.prototype.toString = function toString() {
  return this.name;
};

function get(arg, keys) {
  if (~networks.indexOf(arg)) {
    return arg;
  }
  if (keys) {
    if (!_.isArray(keys)) {
      keys = [keys];
    }
    var containsArg = function (key) {
      return networks[index][key] === arg;
    };
    for (var index in networks) {
      if (_.some(keys, containsArg)) {
        return networks[index];
      }
    }
    return undefined;
  }

  var network = networkMaps[arg];

  if (network && network === testnet && (arg === 'local' || arg === 'regtest')) {
    enableRegtest();
  }

  return network;
}

function addNetwork(data, options) {
  options = options || {};
  var network = new Network();

  var staticProps = {
    name: data.name,
    alias: data.alias,
    pubkeyhash: data.pubkeyhash,
    privatekey: data.privatekey,
    scripthash: data.scripthash,
    xpubkey: data.xpubkey,
    xprivkey: data.xprivkey,
    xpubkey256bit: data.xpubkey256bit,
    xprivkey256bit: data.xprivkey256bit,
  };

  if (data.messageMagic) {
    staticProps.messageMagic = data.messageMagic;
  }

  JSUtil.defineImmutable(network, staticProps);

  if (data.networkMagic && !options.noStaticNetworkMagic) {
    JSUtil.defineImmutable(network, {
      networkMagic: BufferUtil.integerAsBuffer(data.networkMagic),
    });
  }

  if (data.port && !options.noStaticPort) {
    JSUtil.defineImmutable(network, {
      port: data.port,
    });
  }

  if (data.dnsSeeds && !options.noStaticDnsSeeds) {
    JSUtil.defineImmutable(network, {
      dnsSeeds: data.dnsSeeds,
    });
  }

  _.each(network, function (value) {
    if (!_.isUndefined(value) && !_.isObject(value)) {
      networkMaps[value] = network;
    }

    if (Array.isArray(value)) {
      value.forEach(function (v) {
        networkMaps[v] = network;
      });
    }
  });

  networks.push(network);

  if (activeNetwork === null) {
    activeNetwork = network;
  }

  return network;
}

function removeNetwork(network) {
  for (var i = 0; i < networks.length; i++) {
    if (networks[i] === network) {
      networks.splice(i, 1);
    }
  }
  for (var key in networkMaps) {
    if (networkMaps[key] === network) {
      delete networkMaps[key];
    }
  }
  if (activeNetwork === network) {
    activeNetwork = networks.length > 0 ? networks[0] : null;
  }
}

function setActive(name) {
  var network = get(name);
  if (!network) {
    throw new Error('Network not found: ' + name);
  }
  activeNetwork = network;
}

function getActive() {
  if (activeNetwork === null) {
    throw new Error('No active network registered. Call Networks.add() or Networks.setActive() first.');
  }
  return activeNetwork;
}

var MAXIMUS_LIVENET = {
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
};

addNetwork(MAXIMUS_LIVENET);

var livenet = get('livenet');

var MAXIMUS_TESTNET = {
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
};

addNetwork(MAXIMUS_TESTNET, { noStaticNetworkMagic: true, noStaticPort: true, noStaticDnsSeeds: true });

var testnet = get('testnet');

var REGTEST = {
  PORT: 19994,
  NETWORK_MAGIC: BufferUtil.integerAsBuffer(0xfcc1b7dc),
  DNS_SEEDS: [],
};

for (var key in REGTEST) {
  if (!_.isObject(REGTEST[key])) {
    networkMaps[REGTEST[key]] = testnet;
  }
}

Object.defineProperty(testnet, 'port', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return REGTEST.PORT;
    } else {
      return MAXIMUS_TESTNET.port;
    }
  },
});

Object.defineProperty(testnet, 'networkMagic', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return REGTEST.NETWORK_MAGIC;
    } else {
      return BufferUtil.integerAsBuffer(MAXIMUS_TESTNET.networkMagic);
    }
  },
});

Object.defineProperty(testnet, 'dnsSeeds', {
  enumerable: true,
  configurable: false,
  get: function () {
    if (this.regtestEnabled) {
      return REGTEST.DNS_SEEDS;
    } else {
      return MAXIMUS_TESTNET.dnsSeeds;
    }
  },
});

function enableRegtest() {
  testnet.regtestEnabled = true;
}

function disableRegtest() {
  testnet.regtestEnabled = false;
}

module.exports = {
  add: addNetwork,
  remove: removeNetwork,
  get: get,
  setActive: setActive,
  getActive: getActive,
  enableRegtest: enableRegtest,
  disableRegtest: disableRegtest,

  get livenet() {
    return get('livenet');
  },
  get testnet() {
    return get('testnet');
  },
  get mainnet() {
    return get('mainnet');
  },
  get defaultNetwork() {
    return activeNetwork;
  },
  set defaultNetwork(value) {
    var network = get(value);
    if (!network) {
      throw new Error('Network not found: ' + value);
    }
    activeNetwork = network;
  },
};
