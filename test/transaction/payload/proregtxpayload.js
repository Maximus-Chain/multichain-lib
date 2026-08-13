/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

var expect = require('chai').expect;
var sinon = require('sinon');

var proRegTxFixture = require('../../fixtures/payload/proregtxpayload');

var DashcoreLib = require('../../_setup');
var multichain = require('../../../');

var ProRegTxPayload = DashcoreLib.Transaction.Payload.ProRegTxPayload;

describe('ProRegTxPayload', function () {
  beforeEach(function () {
    sinon.spy(ProRegTxPayload.prototype, 'validate');
  });

  afterEach(function () {
    ProRegTxPayload.prototype.validate.restore();
  });

  describe('.fromBuffer', function () {
    it('Should return instance of ProRegTxPayload and call #validate on it', function () {
      var payload = ProRegTxPayload.fromBuffer(
        proRegTxFixture.getProRegPayloadBuffer()
      );

      expect(
        payload.toJSON({
          network: 'testnet',
          skipSignature: true,
        })
      ).to.be.deep.equal(proRegTxFixture.getProRegPayloadJSON());
    });

    it('Should throw in case if there is some unexpected information in raw payload', function () {
      var payloadWithAdditionalZeros = Buffer.from(
        proRegTxFixture.getProRegPayloadHex() + '0000',
        'hex'
      );

      expect(function () {
        ProRegTxPayload.fromBuffer(payloadWithAdditionalZeros);
      }).to.throw(
        'Failed to parse payload: raw payload is bigger than expected.'
      );
    });
  });

  describe('.fromJSON', function () {
    it('Should return instance of ProRegTxPayload and call #validate on it', function () {
      var payload = ProRegTxPayload.fromJSON(
        proRegTxFixture.getProRegPayloadJSON()
      );
      var restoredJSON = payload.toJSON({ network: 'testnet' });

      expect(restoredJSON).to.be.deep.equal(
        proRegTxFixture.getProRegPayloadJSON()
      );
    });
  });

  describe('#toJSON', function () {
    it('Should be able to serialize payload JSON', function () {
      var payload = ProRegTxPayload.fromBuffer(
        proRegTxFixture.getProRegPayloadBuffer()
      );

      var payloadJSON = payload.toJSON({
        network: 'testnet',
        skipSignature: true,
      });
      expect(payloadJSON).to.be.deep.equal(
        proRegTxFixture.getProRegPayloadJSON()
      );

      var restoredPayloadHex = ProRegTxPayload.fromJSON(payload.toJSON())
        .toBuffer()
        .toString('hex');
      expect(restoredPayloadHex).to.be.equal(
        proRegTxFixture.getProRegPayloadHex()
      );
    });

    it('Should call #validate', function () {
      var payload = ProRegTxPayload.fromJSON(
        proRegTxFixture.getProRegPayloadJSON()
      );
      ProRegTxPayload.prototype.validate.resetHistory();
      payload.toJSON();
      expect(payload.validate.callCount).to.be.equal(1);
    });
  });

  describe('#toBuffer', function () {
    it('Should be able to serialize payload to Buffer', function () {
      var restoredPayload = ProRegTxPayload.fromBuffer(
        Buffer.from(proRegTxFixture.getProRegPayloadHex(), 'hex')
      );

      expect(restoredPayload.toBuffer().toString('hex')).to.be.equal(
        proRegTxFixture.getProRegPayloadHex()
      );
    });

    it('Should call #validate', function () {
      var payload = ProRegTxPayload.fromJSON(
        proRegTxFixture.getProRegPayloadJSON()
      );
      ProRegTxPayload.prototype.validate.resetHistory();
      payload.toBuffer();
      expect(payload.validate.callCount).to.be.equal(1);
    });
  });

  describe('per-chain defaults', function () {
    it('should default version to 2 on maximus (Dash-style)', function () {
      var maximus = multichain.create('maximus');
      var payload = new maximus.ProRegTxPayload();
      expect(payload.version).to.equal(2);
    });

    it('should default version to 1 on fewbit (FewBit Core accepts only v1)', function () {
      var fewbit = multichain.create('fewbit');
      var payload = new fewbit.ProRegTxPayload();
      expect(payload.version).to.equal(1);
    });

    it('should default version to 2 on osmium (Dash-style)', function () {
      var osmium = multichain.create('osmium');
      var payload = new osmium.ProRegTxPayload();
      expect(payload.version).to.equal(2);
    });

    it('should default version to 2 on filopow (Dash-style)', function () {
      var filopow = multichain.create('filopow');
      var payload = new filopow.ProRegTxPayload();
      expect(payload.version).to.equal(2);
    });

    it('should still let the caller override the default version explicitly', function () {
      var fewbit = multichain.create('fewbit');
      var json = proRegTxFixture.getProRegPayloadJSON();
      var fewbitPayoutAddress = new fewbit.PrivateKey('livenet')
        .toAddress()
        .toString();
      var payload = new fewbit.ProRegTxPayload({
        version: 2,
        type: 0,
        collateralHash: json.collateralHash,
        collateralIndex: json.collateralIndex,
        service: json.service,
        keyIDOwner: json.keyIDOwner,
        pubKeyOperator: json.pubKeyOperator,
        keyIDVoting: json.keyIDVoting,
        operatorReward: json.operatorReward,
        payoutAddress: fewbitPayoutAddress,
        inputsHash: json.inputsHash,
      });
      expect(payload.version).to.equal(2);
    });
  });

  describe('fewbit type=0 enforcement', function () {
    var fewbit;
    var fewbitBaseOptions;
    var maximusBaseOptions;

    beforeEach(function () {
      fewbit = multichain.create('fewbit');
      var maximus = multichain.create('maximus');
      var json = proRegTxFixture.getProRegPayloadJSON();
      // Build per-chain options so the payoutAddress (which the constructor
      // runs through Script.fromAddress) decodes on the right network.
      var fewbitPayoutAddress = new fewbit.PrivateKey('livenet')
        .toAddress()
        .toString();
      var maximusPayoutAddress = json.payoutAddress;
      fewbitBaseOptions = {
        collateralHash: json.collateralHash,
        collateralIndex: json.collateralIndex,
        service: json.service,
        keyIDOwner: json.keyIDOwner,
        pubKeyOperator: json.pubKeyOperator,
        keyIDVoting: json.keyIDVoting,
        operatorReward: json.operatorReward,
        payoutAddress: fewbitPayoutAddress,
        inputsHash: json.inputsHash,
      };
      maximusBaseOptions = {
        collateralHash: json.collateralHash,
        collateralIndex: json.collateralIndex,
        service: json.service,
        keyIDOwner: json.keyIDOwner,
        pubKeyOperator: json.pubKeyOperator,
        keyIDVoting: json.keyIDVoting,
        operatorReward: json.operatorReward,
        payoutAddress: maximusPayoutAddress,
        inputsHash: json.inputsHash,
      };
    });

    it('should accept a fewbit payload with type=0', function () {
      var payload = new fewbit.ProRegTxPayload(
        Object.assign({}, fewbitBaseOptions, { type: 0 })
      );
      expect(function () {
        payload.validate();
      }).to.not.throw();
    });

    it('should reject a fewbit payload with type=1 (MASTERNODE_TYPE_HP)', function () {
      var payload = new fewbit.ProRegTxPayload(
        Object.assign({}, fewbitBaseOptions, { type: 1 })
      );
      expect(function () {
        payload.validate();
      }).to.throw(/MASTERNODE_TYPE_BASIC/);
    });

    it('should reject a non-integer fewbit type (sanity check on the new check)', function () {
      var payload = new fewbit.ProRegTxPayload(
        Object.assign({}, fewbitBaseOptions, { type: 'foo' })
      );
      expect(function () {
        payload.validate();
      }).to.throw(/unsigned integer/);
    });

    it('should not enforce type=0 on maximus (Dash-style)', function () {
      var maximus = multichain.create('maximus');
      var payload = new maximus.ProRegTxPayload(
        Object.assign({}, maximusBaseOptions, { type: 1 })
      );
      expect(function () {
        payload.validate();
      }).to.not.throw();
    });

    it('should skip type validation entirely when type is undefined', function () {
      var payload = new fewbit.ProRegTxPayload(
        Object.assign({}, fewbitBaseOptions)
      );
      // type is undefined — strict enforcement should not fire because the
      // caller never set it. Other validate() checks still apply.
      expect(payload.type).to.equal(undefined);
    });
  });

  describe('setExtraPayload round-trip (regression for 4.0.0)', function () {
    // Commit 74399b3 changed createPayloadClass(Networks, config) to use
    // [Networks, config] as a WeakMap key, but didn't propagate `config`
    // to createTransactionClass. That left the Transaction class with a
    // different ProRegTxPayload class than the one returned by
    // mc.ProRegTxPayload, so setExtraPayload's instanceof check threw
    // "Payload doesn't match the transaction type" on every chain (MAXI
    // included) even though the per-chain logic was untouched.

    function buildProRegTxPayloadOptions(json, payoutAddress) {
      return {
        type: 1,
        mode: 0,
        collateralHash: json.collateralHash,
        collateralIndex: json.collateralIndex,
        service: json.service,
        keyIDOwner: json.keyIDOwner,
        pubKeyOperator: json.pubKeyOperator,
        keyIDVoting: json.keyIDVoting,
        operatorReward: json.operatorReward,
        payoutAddress: payoutAddress,
        inputsHash: json.inputsHash,
      };
    }

    it('should accept a maximus ProRegTxPayload via setExtraPayload', function () {
      var maximus = multichain.create('maximus');
      var payoutAddress = new maximus.PrivateKey('livenet').toAddress().toString();
      var payload = new maximus.ProRegTxPayload(
        buildProRegTxPayloadOptions(
          proRegTxFixture.getProRegPayloadJSON(),
          payoutAddress
        )
      );
      var tx = new maximus.Transaction();
      tx.type = 1; // TRANSACTION_PROVIDER_REGISTER

      expect(function () {
        tx.setExtraPayload(payload);
      }).to.not.throw();
      expect(tx.extraPayload).to.equal(payload);
    });

    it('should accept a fewbit ProRegTxPayload (type=0) via setExtraPayload', function () {
      var fewbit = multichain.create('fewbit');
      var payoutAddress = new fewbit.PrivateKey('livenet').toAddress().toString();
      var opts = buildProRegTxPayloadOptions(
        proRegTxFixture.getProRegPayloadJSON(),
        payoutAddress
      );
      opts.type = 0; // MASTERNODE_TYPE_BASIC (required on fewbit)
      var payload = new fewbit.ProRegTxPayload(opts);
      var tx = new fewbit.Transaction();
      tx.type = 1;

      expect(function () {
        tx.setExtraPayload(payload);
      }).to.not.throw();
      expect(tx.extraPayload).to.equal(payload);
    });

    it('should keep ProRegTxPayload stable across repeated create() calls on the same chain', function () {
      // If the cache key were unstable, two create('maximus') calls would
      // hand out different ProRegTxPayload classes and the round-trip
      // above would still work, but cross-instance identity would not.
      // Lock in identity within a single instance.
      var mc = multichain.create('maximus');
      expect(mc.Transaction.Payload.ProRegTxPayload).to.equal(
        mc.ProRegTxPayload
      );
    });
  });
});
