/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

require('chai').should();
var chai = require('chai');

var multichain = require('../../');
var kerrigan = multichain.create('kerrigan');

describe('Kerrigan chain', function () {
  describe('registration', function () {
    it('should be listed as a built-in chain', function () {
      multichain.chains().should.include('kerrigan');
    });

    it('should expose Networks, Address, Transaction, Unit and more', function () {
      kerrigan.should.have.property('Networks');
      kerrigan.should.have.property('Address');
      kerrigan.should.have.property('Transaction');
      kerrigan.should.have.property('Unit');
      kerrigan.should.have.property('Script');
      kerrigan.should.have.property('Message');
      kerrigan.should.have.property('Mnemonic');
      kerrigan.should.have.property('HDPrivateKey');
      kerrigan.should.have.property('HDPublicKey');
      kerrigan.should.have.property('PrivateKey');
      kerrigan.should.have.property('PublicKey');
      kerrigan.should.have.property('crypto');
      kerrigan.should.have.property('encoding');
    });

    it('should expose a hash registry with no PoW algorithms pre-loaded', function () {
      kerrigan.crypto.Hash.list().should.deep.equal([]);
    });
  });

  describe('livenet', function () {
    var net = kerrigan.Networks.livenet;

    it('should have name "livenet" with aliases "mainnet" and "kerrigan"', function () {
      net.name.should.equal('livenet');
      net.alias.should.deep.equal(['mainnet', 'kerrigan']);
    });

    it('should have Kerrigan version bytes (prefix "K")', function () {
      net.pubkeyhash.should.equal(45); // 0x2D → 'K'
      net.privatekey.should.equal(204); // 0xCC
      net.scripthash.should.equal(16); // 0x10 → '7'
    });

    it('should use Bitcoin-default HD versions (no DIP-14)', function () {
      net.xpubkey.should.equal(0x0488b21e);
      net.xprivkey.should.equal(0x0488ade4);
      chai.expect(net.xpubkey256bit).to.be.undefined;
      chai.expect(net.xprivkey256bit).to.be.undefined;
    });

    it('should have P2P magic spelling "KRGN"', function () {
      Buffer.isBuffer(net.networkMagic).should.equal(true);
      net.networkMagic.toString('hex').should.equal('4b52474e');
    });

    it('should have Kerrigan P2P port and DNS seeds', function () {
      net.port.should.equal(7120);
      net.dnsSeeds.should.deep.equal([
        'seed1.kerrigan.network',
        'seed2.kerrigan.network',
        'seed3.kerrigan.network',
        'seed4.kerrigan.network',
      ]);
    });

    it('should have the Dash-inherited message magic', function () {
      net.messageMagic.should.equal('DarkCoin Signed Message:\n');
    });
  });

  describe('testnet', function () {
    var net = kerrigan.Networks.testnet;

    it('should have name "testnet"', function () {
      net.name.should.equal('testnet');
    });

    it('should have Kerrigan testnet version bytes (prefix "k")', function () {
      net.pubkeyhash.should.equal(107); // 0x6B → 'k'
      net.privatekey.should.equal(239); // 0xEF
      net.scripthash.should.equal(19); // 0x13
    });

    it('should use tpub/tprv HD versions', function () {
      net.xpubkey.should.equal(0x043587cf);
      net.xprivkey.should.equal(0x04358394);
    });

    it('should have P2P magic spelling "krgt"', function () {
      Buffer.isBuffer(net.networkMagic).should.equal(true);
      net.networkMagic.toString('hex').should.equal('6b726774');
    });

    it('should have Kerrigan testnet port and empty DNS seeds', function () {
      net.port.should.equal(17120);
      net.dnsSeeds.should.deep.equal([]);
    });

    it('should have the same Dash-inherited message magic as livenet', function () {
      net.messageMagic.should.equal('DarkCoin Signed Message:\n');
    });
  });

  describe('address generation', function () {
    it('should generate a livenet address starting with "K"', function () {
      var pk = new kerrigan.PrivateKey('livenet');
      var addr = pk.toAddress();
      addr.network.name.should.equal('livenet');
      addr.toString().charAt(0).should.equal('K');
    });

    it('should generate a testnet address starting with "k"', function () {
      var pk = new kerrigan.PrivateKey('testnet');
      var addr = pk.toAddress();
      addr.network.name.should.equal('testnet');
      addr.toString().charAt(0).should.equal('k');
    });

    it('should round-trip a livenet WIF', function () {
      var pk = new kerrigan.PrivateKey('livenet');
      var restored = kerrigan.PrivateKey.fromWIF(pk.toWIF());
      restored.toAddress().toString().should.equal(pk.toAddress().toString());
    });

    it('should not validate a Maximus address as Kerrigan', function () {
      var maxiAddr = new (multichain.create('maximus').PrivateKey)('livenet')
        .toAddress()
        .toString();
      kerrigan.Address.isValid(maxiAddr, 'livenet').should.equal(false);
    });
  });

  describe('message sign/verify', function () {
    it('should round-trip a message with a livenet key', function () {
      var pk = new kerrigan.PrivateKey('livenet');
      var msg = new kerrigan.Message('hello kerrigan');
      var sig = msg.sign(pk);
      msg.verify(pk.toAddress(), sig).should.equal(true);
    });

    it('should round-trip a message with a testnet key', function () {
      var pk = new kerrigan.PrivateKey('testnet');
      var msg = new kerrigan.Message('hello kerrigan');
      var sig = msg.sign(pk);
      msg.verify(pk.toAddress(), sig).should.equal(true);
    });
  });

  describe('HD derivation', function () {
    it('should derive a deterministic livenet address on the BIP44 path', function () {
      var seed = Buffer.alloc(32, 1);
      var a = kerrigan.HDPrivateKey.fromSeed(seed, kerrigan.Networks.livenet)
        .deriveChild("m/44'/99888'/0'/0/0")
        .privateKey.toAddress()
        .toString();
      var b = kerrigan.HDPrivateKey.fromSeed(seed, kerrigan.Networks.livenet)
        .deriveChild("m/44'/99888'/0'/0/0")
        .privateKey.toAddress()
        .toString();
      a.should.equal(b);
      a.charAt(0).should.equal('K');
    });
  });

  describe('ipv6', function () {
    it('should not advertise IPv6 service support on livenet', function () {
      chai.expect(kerrigan.Networks.livenet.supportsIPv6).to.be.undefined;
    });
    it('should not advertise IPv6 service support on testnet', function () {
      chai.expect(kerrigan.Networks.testnet.supportsIPv6).to.be.undefined;
    });
  });

  describe('regtest switch', function () {
    it('should toggle regtest port/magic on the testnet network', function () {
      kerrigan.Networks.disableRegtest();
      kerrigan.Networks.testnet.port.should.equal(17120);

      kerrigan.Networks.enableRegtest();
      kerrigan.Networks.testnet.regtestEnabled.should.equal(true);

      kerrigan.Networks.disableRegtest();
      kerrigan.Networks.testnet.regtestEnabled.should.equal(false);
      kerrigan.Networks.testnet.port.should.equal(17120);
    });
  });

  describe('ProRegTxPayload chain binding', function () {
    var proRegTxFixture = require('../fixtures/payload/proregtxpayload');

    function buildKerriganOptions() {
      var json = proRegTxFixture.getProRegPayloadJSON();
      var payoutAddress = new kerrigan.PrivateKey('livenet')
        .toAddress()
        .toString();
      return {
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

    it('should default ProRegTxPayload.version to 2 (Dash BasicBLS)', function () {
      new kerrigan.ProRegTxPayload().version.should.equal(2);
    });

    it('should serialize a v2, type=1 (Evo / BroodNode) payload', function () {
      var payload = new kerrigan.ProRegTxPayload(
        Object.assign(buildKerriganOptions(), { type: 1 })
      );
      payload.validate();
      var buf = payload.toBuffer();
      buf.readUInt16LE(0).should.equal(2); // version
      buf.readUInt16LE(2).should.equal(1); // type
      buf.readUInt16LE(4).should.equal(0); // mode
    });

    it('should accept a type=0 (Regular) payload', function () {
      var payload = new kerrigan.ProRegTxPayload(
        Object.assign(buildKerriganOptions(), { type: 0 })
      );
      (function () {
        payload.validate();
      }).should.not.throw();
    });

    it('should attach to a Transaction via setExtraPayload', function () {
      var payload = new kerrigan.ProRegTxPayload(
        Object.assign(buildKerriganOptions(), { type: 1 })
      );
      var tx = new kerrigan.Transaction();
      tx.setType(kerrigan.Transaction.TYPES.TRANSACTION_PROVIDER_REGISTER);
      tx.setExtraPayload(payload);
      tx.extraPayload.should.equal(payload);
    });
  });
});
