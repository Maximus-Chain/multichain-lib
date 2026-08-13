/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

var constants = require('../../constants');
var RegisteredPayloadTypes = constants.registeredTransactionTypes;
var createProRegTxPayloadClass =
  require('./proregtxpayload').createProRegTxPayloadClass;

var payloadNamespaceCache = new WeakMap();

/**
 * Creates a `Payload` namespace (parse/serialize/create helpers) whose
 * registered payload classes (currently just `ProRegTxPayload`) are bound to
 * the given `Networks` instance.
 *
 * @param {Object} Networks - a `lib/networks.js` `createNetworks()` instance
 * @param {Object} [config] - the chain's `ChainConfig`. Forwarded to payload
 *   factories so they can pick the right per-chain defaults (e.g. FewBit
 *   `payloadVersions.proRegTx === 1`) and validation rules.
 * @returns {Object} the `Payload` namespace
 */
function createPayloadClass(Networks, config) {
  var byConfig = payloadNamespaceCache.get(Networks);
  if (!byConfig) {
    byConfig = new Map();
    payloadNamespaceCache.set(Networks, byConfig);
  }
  if (byConfig.has(config)) {
    return byConfig.get(config);
  }

  var ProRegTxPayload = createProRegTxPayloadClass(Networks, config);

  var PayloadClasses = {};
  PayloadClasses[RegisteredPayloadTypes.TRANSACTION_PROVIDER_REGISTER] =
    ProRegTxPayload;

  function getPayloadClass(payloadType) {
    var GenericPayload = PayloadClasses[payloadType];
    if (!GenericPayload) {
      throw new Error('Unknown special transaction type');
    }
    return GenericPayload;
  }

  function parsePayloadBuffer(payloadType, rawPayload) {
    var Payload = getPayloadClass(payloadType);
    return Payload.fromBuffer(rawPayload);
  }

  function parsePayloadJSON(payloadType, payloadJson) {
    var Payload = getPayloadClass(payloadType);
    return Payload.fromJSON(payloadJson);
  }

  function createPayload(payloadType) {
    var Payload = getPayloadClass(payloadType);
    return new Payload();
  }

  function isPayloadMatchesType(payloadType, payload) {
    var GenericPayload = getPayloadClass(payloadType);
    return payload instanceof GenericPayload;
  }

  function serializePayloadToBuffer(payload) {
    return payload.toBuffer();
  }

  function serializePayloadToJSON(payload) {
    return payload.toJSON();
  }

  var namespace = {
    parseBuffer: parsePayloadBuffer,
    parseJSON: parsePayloadJSON,
    serializeToBuffer: serializePayloadToBuffer,
    serializeToJSON: serializePayloadToJSON,
    create: createPayload,
    hasCorrectType: isPayloadMatchesType,
    ProRegTxPayload: ProRegTxPayload,
    constants: constants,
  };

  byConfig.set(config, namespace);

  return namespace;
}

module.exports = { createPayloadClass: createPayloadClass };
