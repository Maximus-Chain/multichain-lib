/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

var inputClassesCache = new WeakMap();

/**
 * Creates the base `Input` class bound to the given `Networks` instance,
 * with the concrete subclasses attached as static properties (mirroring the
 * legacy shape: `Input.PublicKeyHash`, `Input.PublicKey`, `Input.MultiSig`,
 * `Input.MultiSigScriptHash`).
 *
 * @param {Object} Networks - a `lib/networks.js` `createNetworks()` instance
 * @returns {Input}
 */
function createInputClasses(Networks) {
  if (inputClassesCache.has(Networks)) {
    return inputClassesCache.get(Networks);
  }

  var Input = require('./input').createInputClass(Networks);

  Input.PublicKey = require('./publickey').createPublicKeyInputClass(Networks);
  Input.PublicKeyHash =
    require('./publickeyhash').createPublicKeyHashInputClass(Networks);
  Input.MultiSig = require('./multisig').createMultiSigInputClass(Networks);
  Input.MultiSigScriptHash =
    require('./multisigscripthash').createMultiSigScriptHashInputClass(
      Networks
    );

  inputClassesCache.set(Networks, Input);

  return Input;
}

module.exports = { createInputClasses: createInputClasses };
