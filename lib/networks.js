/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var _ = require('lodash');

var BufferUtil = require('./util/buffer');
var JSUtil = require('./util/js');

function Network() {}

Network.prototype.toString = function toString() {
  return this.name;
};

function createNetworks() {
  var networks = [];
  var networkMaps = {};
  var activeNetwork = null;

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

    if (data.hashFunction) {
      staticProps.hashFunction = data.hashFunction;
    }

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
      throw new Error(
        'No active network registered. Call Networks.add() or Networks.setActive() first.'
      );
    }
    return activeNetwork;
  }

  var REGTEST = {
    PORT: 19994,
    NETWORK_MAGIC: BufferUtil.integerAsBuffer(0xfcc1b7dc),
    DNS_SEEDS: [],
  };

  var testnet = null;

  function enableRegtest() {
    if (testnet) testnet.regtestEnabled = true;
  }

  function disableRegtest() {
    if (testnet) testnet.regtestEnabled = false;
  }

  var instance = {
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

  var origAdd = instance.add;
  instance.add = function (data, options) {
    var network = origAdd(data, options);
    if (data.name === 'testnet') {
      testnet = network;

      for (var key in REGTEST) {
        if (!_.isObject(REGTEST[key])) {
          networkMaps[REGTEST[key]] = network;
        }
      }

      Object.defineProperty(testnet, 'port', {
        enumerable: true,
        configurable: false,
        get: function () {
          if (this.regtestEnabled) {
            return REGTEST.PORT;
          } else {
            return data.port;
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
            return BufferUtil.integerAsBuffer(data.networkMagic);
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
            return data.dnsSeeds;
          }
        },
      });
    }
    return network;
  };

  return instance;
}

module.exports = {
  create: createNetworks,
};