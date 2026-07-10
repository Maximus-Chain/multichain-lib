var Transaction = require('./transaction');

Transaction.createInputClasses = require('./input').createInputClasses;
Transaction.createOutputClass = require('./output').createOutputClass;
Transaction.createUnspentOutputClass =
  require('./unspentoutput').createUnspentOutputClass;
Transaction.createTransactionSignatureClass =
  require('./signature').createTransactionSignatureClass;
Transaction.createSighash = require('./sighash').createSighash;
Transaction.createPayloadClass = require('./payload').createPayloadClass;

module.exports = Transaction;
