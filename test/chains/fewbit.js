/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

require('chai').should();
var chai = require('chai');

var multichain = require('../../');
var fewbit = multichain.create('fewbit');

describe('Fewbit chain', function () {
  describe('registration', function () {
    it('should be listed as a built-in chain', function () {
      multichain.chains().should.include('fewbit');
    });

    it('should expose Networks, Address, Transaction, Unit and more', function () {
      fewbit.should.have.property('Networks');
      fewbit.should.have.property('Address');
      fewbit.should.have.property('Transaction');
      fewbit.should.have.property('Unit');
      fewbit.should.have.property('Script');
      fewbit.should.have.property('Message');
      fewbit.should.have.property('Mnemonic');
      fewbit.should.have.property('HDPrivateKey');
      fewbit.should.have.property('HDPublicKey');
      fewbit.should.have.property('PrivateKey');
      fewbit.should.have.property('PublicKey');
      fewbit.should.have.property('crypto');
      fewbit.should.have.property('encoding');
    });

    it('should expose a hash registry with no PoW algorithms pre-loaded', function () {
      fewbit.crypto.Hash.list().should.deep.equal([]);
    });
  });

  describe('livenet', function () {
    var net = fewbit.Networks.livenet;

    it('should have name "livenet" with aliases "mainnet" and "fewbit"', function () {
      net.name.should.equal('livenet');
      net.alias.should.deep.equal(['mainnet', 'fewbit']);
    });

    it('should have Fewbit version bytes (prefix "F")', function () {
      net.pubkeyhash.should.equal(35); // 0x23 → 'F'
      net.privatekey.should.equal(128); // 0x80
      net.scripthash.should.equal(16); // 0x10 → '7'
    });

    it('should use Bitcoin-default HD versions (no DIP-14)', function () {
      net.xpubkey.should.equal(0x0488b21e);
      net.xprivkey.should.equal(0x0488ade4);
      // DIP-14 256-bit variants are not implemented by Fewbit
      chai.expect(net.xpubkey256bit).to.be.undefined;
      chai.expect(net.xprivkey256bit).to.be.undefined;
    });

    it('should have P2P magic spelling "fbc."', function () {
      Buffer.isBuffer(net.networkMagic).should.equal(true);
      net.networkMagic.toString('hex').should.equal('6662632e');
    });

    it('should have Fewbit P2P port and DNS seeds', function () {
      net.port.should.equal(1155);
      net.dnsSeeds.should.deep.equal([
        '89.168.20.232',
        '89.168.18.209',
        'explorer.fewbit.online',
        'fewbit.online',
      ]);
    });

    it('should have the Dash-inherited message magic', function () {
      net.messageMagic.should.equal('DarkCoin Signed Message:\n');
    });
  });

  describe('testnet', function () {
    var net = fewbit.Networks.testnet;

    it('should have name "testnet"', function () {
      net.name.should.equal('testnet');
    });

    it('should have Fewbit testnet version bytes (prefix "f")', function () {
      net.pubkeyhash.should.equal(95); // 0x5F → 'f'
      net.privatekey.should.equal(239); // 0xEF (Bitcoin default)
      net.scripthash.should.equal(19); // 0x13
    });

    it('should use tpub/tprv HD versions', function () {
      net.xpubkey.should.equal(0x043587cf);
      net.xprivkey.should.equal(0x04358394);
    });

    it('should have P2P magic spelling "fbc." (same as livenet)', function () {
      Buffer.isBuffer(net.networkMagic).should.equal(true);
      net.networkMagic.toString('hex').should.equal('6662632e');
    });

    it('should have Fewbit testnet port and empty DNS seeds', function () {
      net.port.should.equal(11551);
      net.dnsSeeds.should.deep.equal([]);
    });

    it('should have the same Dash-inherited message magic as livenet', function () {
      net.messageMagic.should.equal('DarkCoin Signed Message:\n');
    });
  });

  describe('address generation', function () {
    it('should generate a livenet address starting with "F"', function () {
      var pk = new fewbit.PrivateKey('livenet');
      var addr = pk.toAddress();
      addr.network.name.should.equal('livenet');
      addr.toString().charAt(0).should.equal('F');
    });

    it('should generate a testnet address starting with "f"', function () {
      var pk = new fewbit.PrivateKey('testnet');
      var addr = pk.toAddress();
      addr.network.name.should.equal('testnet');
      addr.toString().charAt(0).should.equal('f');
    });
  });

  describe('message sign/verify', function () {
    it('should round-trip a message with a livenet key', function () {
      var pk = new fewbit.PrivateKey('livenet');
      var msg = new fewbit.Message('hello fewbit');
      var sig = msg.sign(pk);
      msg.verify(pk.toAddress(), sig).should.equal(true);
    });

    it('should round-trip a message with a testnet key', function () {
      var pk = new fewbit.PrivateKey('testnet');
      var msg = new fewbit.Message('hello fewbit');
      var sig = msg.sign(pk);
      msg.verify(pk.toAddress(), sig).should.equal(true);
    });
  });

  describe('hash registry', function () {
    it('should expose the pure Bitcoin/Dash hashes', function () {
      fewbit.crypto.Hash.sha256.should.be.a('function');
      fewbit.crypto.Hash.sha256sha256.should.be.a('function');
      fewbit.crypto.Hash.sha256ripemd160.should.be.a('function');
      fewbit.crypto.Hash.ripemd160.should.be.a('function');
    });

    it('should produce deterministic hashes for known inputs', function () {
      var buf = Buffer.from('test', 'utf8');
      var a = fewbit.crypto.Hash.sha256sha256(buf);
      var b = fewbit.crypto.Hash.sha256sha256(buf);
      Buffer.isBuffer(a).should.equal(true);
      a.toString('hex').should.equal(b.toString('hex'));
      a.length.should.equal(32);
    });

    it('should let consumers register custom hash algorithms', function () {
      var fp = fewbit.crypto.Hash;
      var calls = 0;
      fp.register('ghostrider_marker', function (buf) {
        calls++;
        return Buffer.from('gr:' + buf.toString('utf8'), 'utf8');
      });
      var h = fp.get('ghostrider_marker')(Buffer.from('x', 'utf8'));
      calls.should.equal(1);
      h.toString('utf8').should.equal('gr:x');
      fp.list().should.include('ghostrider_marker');
      fp.listAlgorithms().should.include('ghostrider_marker');
    });
  });

  describe('ipv6', function () {
    it('should not advertise IPv6 service support on livenet', function () {
      chai.expect(fewbit.Networks.livenet.supportsIPv6).to.be.undefined;
    });
    it('should not advertise IPv6 service support on testnet', function () {
      chai.expect(fewbit.Networks.testnet.supportsIPv6).to.be.undefined;
    });
  });

  describe('regtest switch', function () {
    it('should toggle regtest port/magic on the testnet network', function () {
      fewbit.Networks.disableRegtest();
      fewbit.Networks.testnet.port.should.equal(11551);

      fewbit.Networks.enableRegtest();
      fewbit.Networks.testnet.regtestEnabled.should.equal(true);

      fewbit.Networks.disableRegtest();
      fewbit.Networks.testnet.regtestEnabled.should.equal(false);
      fewbit.Networks.testnet.port.should.equal(11551);
    });
  });

  describe('ProRegTxPayload chain binding', function () {
    var multichain = require('../../');
    var proRegTxFixture = require('../fixtures/payload/proregtxpayload');

    function buildFewbitOptions() {
      var json = proRegTxFixture.getProRegPayloadJSON();
      var fewbitPayoutAddress = new fewbit.PrivateKey('livenet')
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
        payoutAddress: fewbitPayoutAddress,
        inputsHash: json.inputsHash,
      };
    }

    it('should default ProRegTxPayload.version to 1 on fewbit', function () {
      var payload = new fewbit.ProRegTxPayload();
      payload.version.should.equal(1);
    });

    it('should serialize a v1, type=0 fewbit ProRegTxPayload', function () {
      var payload = new fewbit.ProRegTxPayload(
        Object.assign(buildFewbitOptions(), { type: 0 })
      );
      var buf = payload.toBuffer();
      // version(1) + type(0) + mode(0) all little-endian uint16
      buf.readUInt16LE(0).should.equal(1); // version
      buf.readUInt16LE(2).should.equal(0); // type
      buf.readUInt16LE(4).should.equal(0); // mode
    });

    it('should reject a fewbit ProRegTxPayload with type=1', function () {
      var payload = new fewbit.ProRegTxPayload(
        Object.assign(buildFewbitOptions(), { type: 1 })
      );
      (function () {
        payload.validate();
      }).should.throw(/MASTERNODE_TYPE_BASIC/);
    });

    it('should keep its own ProRegTxPayload class per create() call', function () {
      var a = multichain.create('fewbit');
      var b = multichain.create('fewbit');
      a.ProRegTxPayload.should.not.equal(b.ProRegTxPayload);
      a.ProRegTxPayload.should.not.equal(multichain.create('maximus').ProRegTxPayload);
    });

    it('should not affect maximus ProRegTxPayload defaults', function () {
      var maximus = multichain.create('maximus');
      new maximus.ProRegTxPayload().version.should.equal(2);
    });
  });
});
