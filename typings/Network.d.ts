/**
 * A network is merely a map containing values that correspond to version
 * numbers for each bitcoin network. Networks can be registered dynamically
 * using Networks.add().
 * @constructor
 */
export class Network {
  name: string;
  alias: string | string[];
  pubkeyhash: number;
  privatekey: number;
  scripthash: number;
  xpubkey: number;
  xprivkey: number;
  xpubkey256bit: number;
  xprivkey256bit: number;
  networkMagic?: Buffer;
  port?: number;
  dnsSeeds?: string[];
  messageMagic?: string;
  hashFunction?: string | ((buf: Buffer) => Buffer);
  supportsIPv6?: boolean;
  regtestEnabled?: boolean;
}

/**
 * @namespace Networks
 */
export namespace Networks {
  /**
   * @function
   * @member Networks#get
   * Retrieves the network associated with a magic number or string.
   * @param {string|number|Network} arg
   * @param {string|Array} keys - if set, only check if the magic number associated with this name matches
   * @returns {Network}
   */
  function get(arg: string | number | Network, keys?: string | string[]): Network | undefined;

  /**
   * @function
   * @member Networks#add
   * Will add a custom Network
   * @param {Object} data
   * @param {string} data.name - The name of the network
   * @param {string|string[]} data.alias - The aliased name of the network
   * @param {string} data.messageMagic - The magic bytes for message signing
   * @param {Number} data.pubkeyhash - The publickey hash prefix
   * @param {Number} data.privatekey - The privatekey prefix
   * @param {Number} data.scripthash - The scripthash prefix
   * @param {Number} data.xpubkey - The extended public key magic
   * @param {Number} data.xprivkey - The extended private key magic
   * @param {Number} data.xpubkey256bit - The extended public key magic for DIP14
   * @param {Number} data.xprivkey256bit - The extended private key magic for DIP14
   * @param {Number} data.networkMagic - The network magic number
   * @param {Number} data.port - The network port
   * @param {Array}  data.dnsSeeds - An array of dns seeds
   * @param {string|function} data.hashFunction - The hash algorithm name (e.g. 'x11') or function
   * @return {Network}
   */
  function add(data: Network): Network;

  /**
   * @function
   * @member Networks#remove
   * Will remove a custom network
   * @param {Network} network
   */
  function remove(network: Network): void;

  /**
   * @function
   * @member Networks#setActive
   * Sets the active network by name or alias
   * @param {string} name - The name or alias of the network
   */
  function setActive(name: string): void;

  /**
   * @function
   * @member Networks#getActive
   * Gets the currently active network
   * @returns {Network}
   */
  function getActive(): Network;

  /**
   * @function
   * @member Networks#enableRegtest
   * Will enable regtest features for testnet
   */
  function enableRegtest(): void;

  /**
   * @function
   * @member Networks#disableRegtest
   * Will disable regtest features for testnet
   */
  function disableRegtest(): void;

  /**
   * @instance
   * @member Networks#livenet
   */
  var livenet: Network;

  /**
   * @instance
   * @member Networks#testnet
   */
  var testnet: Network;

  /**
   * @instance
   * @member Networks#mainnet
   */
  var mainnet: Network;

  /**
   * @instance
   * @member Networks#defaultNetwork
   */
  var defaultNetwork: Network;
}
