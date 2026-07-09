/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

var RegisteredPayloadTypes =
  require('../../constants').registeredTransactionTypes;
var AbstractPayload = require('./abstractpayload');
var ProRegTxPayload = require('./proregtxpayload');

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

module.exports = {
  parseBuffer: parsePayloadBuffer,
  parseJSON: parsePayloadJSON,
  serializeToBuffer: serializePayloadToBuffer,
  serializeToJSON: serializePayloadToJSON,
  create: createPayload,
  hasCorrectType: isPayloadMatchesType,
};
