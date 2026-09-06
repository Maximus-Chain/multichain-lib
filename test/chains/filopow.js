/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

require('chai').should();
var chai = require('chai');

var multichain = require('../../');
var filopow = multichain.create('filopow');

describe('filopow chain', function () {
  describe('registration', function () {
    it('should be listed as a built-in chain', function () {
      multichain.chains().should.include('filopow');
    });

    it('should expose Networks, Address, Transaction, Unit and more', function () {
      filopow.should.have.property('Networks');
      filopow.should.have.property('Address');
      filopow.should.have.property('Transaction');
      filopow.should.have.property('Unit');
      filopow.should.have.property('Script');
      filopow.should.have.property('Message');
      filopow.should.have.property('Mnemonic');
      filopow.should.have.property('HDPrivateKey');
      filopow.should.have.property('HDPublicKey');
      filopow.should.have.property('PrivateKey');
      filopow.should.have.property('PublicKey');
      filopow.should.have.property('crypto');
      filopow.should.have.property('encoding');
    });

    it('should expose a hash registry with no PoW algorithms pre-loaded', function () {
      filopow.crypto.Hash.list().should.deep.equal([]);
    });
  });

  describe('livenet', function () {
    var net = filopow.Networks.livenet;

    it('should have name "livenet" with aliases "mainnet" and "filopow"', function () {
      net.name.should.equal('livenet');
      net.alias.should.deep.equal(['mainnet', 'filopow']);
    });

    it('should have filopow version bytes (prefix "F")', function () {
      net.pubkeyhash.should.equal(36); // 0x24 → 'F'
      net.privatekey.should.equal(128); // 0x80
      net.scripthash.should.equal(95); // 0x5F → 'f'
    });

    it('should use Bitcoin-default HD versions', function () {
      net.xpubkey.should.equal(0x0488b21e);
      net.xprivkey.should.equal(0x0488ade4);
      chai.expect(net.xpubkey256bit).to.be.undefined;
      chai.expect(net.xprivkey256bit).to.be.undefined;
    });

    it('should have P2P magic spelling "FPOW"', function () {
      Buffer.isBuffer(net.networkMagic).should.equal(true);
      net.networkMagic.toString('hex').should.equal('46504f57');
    });

    it('should have filopow P2P port and DNS seeds', function () {
      net.port.should.equal(7767);
      net.dnsSeeds.should.deep.equal([
        'seed1.filopow.xyz',
        'seed2.filopow.xyz',
        'seed3.filopow.xyz',
      ]);
    });

    it('should have the filopow message magic', function () {
      net.messageMagic.should.equal('Filopow Signed Message:\n');
    });
  });

  describe('testnet', function () {
    var net = filopow.Networks.testnet;

    it('should have name "testnet"', function () {
      net.name.should.equal('testnet');
    });

    it('should have filopow testnet version bytes (prefix "m"/"n")', function () {
      net.pubkeyhash.should.equal(111); // 0x6F
      net.privatekey.should.equal(239); // 0xEF
      net.scripthash.should.equal(196); // 0xC4
    });

    it('should use tpub/tprv HD versions', function () {
      net.xpubkey.should.equal(0x043587cf);
      net.xprivkey.should.equal(0x04358394);
    });

    it('should have P2P magic spelling "fpow"', function () {
      Buffer.isBuffer(net.networkMagic).should.equal(true);
      net.networkMagic.toString('hex').should.equal('66706f77');
    });

    it('should have filopow testnet port and empty DNS seeds', function () {
      net.port.should.equal(17767);
      net.dnsSeeds.should.deep.equal([]);
    });

    it('should have the same filopow message magic as livenet', function () {
      net.messageMagic.should.equal('Filopow Signed Message:\n');
    });
  });

  describe('address generation', function () {
    it('should generate a livenet address starting with "F"', function () {
      var pk = new filopow.PrivateKey('livenet');
      var addr = pk.toAddress();
      addr.network.name.should.equal('livenet');
      addr.toString().charAt(0).should.equal('F');
    });

    it('should generate a testnet address starting with "m" or "n"', function () {
      var pk = new filopow.PrivateKey('testnet');
      var addr = pk.toAddress();
      addr.network.name.should.equal('testnet');
      var prefix = addr.toString().charAt(0);
      chai.expect(prefix === 'm' || prefix === 'n').to.equal(true);
    });
  });

  describe('message sign/verify', function () {
    it('should round-trip a message with a livenet key', function () {
      var pk = new filopow.PrivateKey('livenet');
      var msg = new filopow.Message('hello filopow');
      var sig = msg.sign(pk);
      msg.verify(pk.toAddress(), sig).should.equal(true);
    });

    it('should round-trip a message with a testnet key', function () {
      var pk = new filopow.PrivateKey('testnet');
      var msg = new filopow.Message('hello filopow');
      var sig = msg.sign(pk);
      msg.verify(pk.toAddress(), sig).should.equal(true);
    });
  });

  describe('hash registry', function () {
    it('should expose the pure Bitcoin/Dash hashes', function () {
      filopow.crypto.Hash.sha256.should.be.a('function');
      filopow.crypto.Hash.sha256sha256.should.be.a('function');
      filopow.crypto.Hash.sha256ripemd160.should.be.a('function');
      filopow.crypto.Hash.ripemd160.should.be.a('function');
    });

    it('should let consumers register custom hash algorithms', function () {
      var fp = filopow.crypto.Hash;
      fp.register('kawpow_marker', function (buf) {
        return Buffer.concat([buf, Buffer.from('KPOW', 'utf8')]);
      });
      var h = fp.get('kawpow_marker')(Buffer.from('h', 'utf8'));
      h.toString('utf8').should.equal('hKPOW');
      fp.list().should.include('kawpow_marker');
    });
  });

  describe('ipv6', function () {
    it('should not advertise IPv6 service support on livenet', function () {
      chai.expect(filopow.Networks.livenet.supportsIPv6).to.be.undefined;
    });
    it('should not advertise IPv6 service support on testnet', function () {
      chai.expect(filopow.Networks.testnet.supportsIPv6).to.be.undefined;
    });
  });

  describe('regtest switch', function () {
    it('should toggle regtest port/magic on the testnet network', function () {
      filopow.Networks.disableRegtest();
      filopow.Networks.testnet.port.should.equal(17767);

      filopow.Networks.enableRegtest();
      filopow.Networks.testnet.regtestEnabled.should.equal(true);

      filopow.Networks.disableRegtest();
      filopow.Networks.testnet.regtestEnabled.should.equal(false);
      filopow.Networks.testnet.port.should.equal(17767);
    });
  });

  describe('ProRegTxPayload chain binding', function () {
    var multichain = require('../../');
    var proRegTxFixture = require('../fixtures/payload/proregtxpayload');

    function buildFilopowOptions() {
      var json = proRegTxFixture.getProRegPayloadJSON();
      var filopowPayoutAddress = new filopow.PrivateKey('livenet')
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
        payoutAddress: filopowPayoutAddress,
        inputsHash: json.inputsHash,
      };
    }

    it('should default ProRegTxPayload.version to 1 on filopow', function () {
      var payload = new filopow.ProRegTxPayload();
      payload.version.should.equal(1);
    });

    it('should serialize a v1, type=0, mode=0 filopow ProRegTxPayload', function () {
      var payload = new filopow.ProRegTxPayload(
        Object.assign(buildFilopowOptions(), { type: 0, mode: 0 })
      );
      var buf = payload.toBuffer();
      // version(1) + type(0) + mode(0) all little-endian uint16
      buf.readUInt16LE(0).should.equal(1); // version
      buf.readUInt16LE(2).should.equal(0); // type
      buf.readUInt16LE(4).should.equal(0); // mode
    });

    it('should reject a filopow ProRegTxPayload with type=1', function () {
      var payload = new filopow.ProRegTxPayload(
        Object.assign(buildFilopowOptions(), { type: 1, mode: 0 })
      );
      (function () {
        payload.validate();
      }).should.throw(/MASTERNODE_TYPE_BASIC/);
    });

    it('should reject a filopow ProRegTxPayload with mode != 0', function () {
      var payload = new filopow.ProRegTxPayload(
        Object.assign(buildFilopowOptions(), { type: 0, mode: 1 })
      );
      (function () {
        payload.validate();
      }).should.throw(/Expected mode to be 0/);
    });

    it('should keep its own ProRegTxPayload class per create() call', function () {
      var a = multichain.create('filopow');
      var b = multichain.create('filopow');
      a.ProRegTxPayload.should.not.equal(b.ProRegTxPayload);
      a.ProRegTxPayload.should.not.equal(
        multichain.create('maximus').ProRegTxPayload
      );
    });

    it('should not affect maximus ProRegTxPayload defaults', function () {
      var maximus = multichain.create('maximus');
      new maximus.ProRegTxPayload().version.should.equal(2);
    });
  });
});