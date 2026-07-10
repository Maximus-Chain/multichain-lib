/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

require('chai').should();
var chai = require('chai');

var multichain = require('../../');
var osmium = multichain.create('osmium');

describe('Osmium chain', function () {
  describe('registration', function () {
    it('should be listed as a built-in chain', function () {
      multichain.chains().should.include('osmium');
    });

    it('should expose Networks, Address, Transaction, Unit and more', function () {
      osmium.should.have.property('Networks');
      osmium.should.have.property('Address');
      osmium.should.have.property('Transaction');
      osmium.should.have.property('Unit');
      osmium.should.have.property('Script');
      osmium.should.have.property('Message');
      osmium.should.have.property('Mnemonic');
      osmium.should.have.property('HDPrivateKey');
      osmium.should.have.property('HDPublicKey');
      osmium.should.have.property('PrivateKey');
      osmium.should.have.property('PublicKey');
      osmium.should.have.property('crypto');
      osmium.should.have.property('encoding');
    });

    it('should register x11 when created', function () {
      osmium.crypto.Hash.list().should.include('x11');
    });
  });

  describe('livenet', function () {
    var net = osmium.Networks.livenet;

    it('should have name "livenet" with alias "mainnet"', function () {
      net.name.should.equal('livenet');
      net.alias.should.deep.equal(['mainnet']);
    });

    it('should have Osmium version bytes', function () {
      net.pubkeyhash.should.equal(63); // 0x3F
      net.privatekey.should.equal(75); // 0x4B
      net.scripthash.should.equal(15); // 0x0F
    });

    it('should use Bitcoin-default HD versions (no DIP-14)', function () {
      net.xpubkey.should.equal(0x0488b21e);
      net.xprivkey.should.equal(0x0488ade4);
      // DIP-14 256-bit variants are not implemented by Osmium
      chai.expect(net.xpubkey256bit).to.be.undefined;
      chai.expect(net.xprivkey256bit).to.be.undefined;
    });

    it('should have P2P magic spelling "OSMI"', function () {
      Buffer.isBuffer(net.networkMagic).should.equal(true);
      net.networkMagic.toString('hex').should.equal('4f534d49');
    });

    it('should have Osmium P2P port and DNS seed', function () {
      net.port.should.equal(9969);
      net.dnsSeeds.should.deep.equal(['dnsseed.osmium.space']);
    });

    it('should have the Dash-inherited message magic', function () {
      net.messageMagic.should.equal('DarkCoin Signed Message:\n');
    });

    it('should declare x11 as the hash function', function () {
      net.hashFunction.should.equal('x11');
    });
  });

  describe('testnet', function () {
    var net = osmium.Networks.testnet;

    it('should have name "testnet"', function () {
      net.name.should.equal('testnet');
    });

    it('should have Osmium testnet version bytes', function () {
      net.pubkeyhash.should.equal(125); // 0x7D
      net.privatekey.should.equal(239); // 0xEF (Bitcoin default)
      net.scripthash.should.equal(12); // 0x0C
    });

    it('should use tpub/tprv HD versions', function () {
      net.xpubkey.should.equal(0x043587cf);
      net.xprivkey.should.equal(0x04358394);
    });

    it('should have P2P magic spelling "tOSM"', function () {
      Buffer.isBuffer(net.networkMagic).should.equal(true);
      net.networkMagic.toString('hex').should.equal('744f534d');
    });

    it('should have Osmium testnet port and DNS seed', function () {
      net.port.should.equal(19969);
      net.dnsSeeds.should.deep.equal(['testnet-seed.osmium.space']);
    });

    it('should have the same Dash-inherited message magic as livenet', function () {
      net.messageMagic.should.equal('DarkCoin Signed Message:\n');
    });

    it('should declare x11 as the hash function', function () {
      net.hashFunction.should.equal('x11');
    });
  });

  describe('address generation', function () {
    it('should generate a livenet address starting with "S"', function () {
      var pk = new osmium.PrivateKey('livenet');
      var addr = pk.toAddress();
      addr.network.name.should.equal('livenet');
      addr.toString().charAt(0).should.equal('S');
    });

    it('should generate a testnet address starting with "s"', function () {
      var pk = new osmium.PrivateKey('testnet');
      var addr = pk.toAddress();
      addr.network.name.should.equal('testnet');
      addr.toString().charAt(0).should.equal('s');
    });
  });

  describe('message sign/verify', function () {
    it('should round-trip a message with a livenet key', function () {
      var pk = new osmium.PrivateKey('livenet');
      var msg = new osmium.Message('hello osmium');
      var sig = msg.sign(pk);
      msg.verify(pk.toAddress(), sig).should.equal(true);
    });

    it('should round-trip a message with a testnet key', function () {
      var pk = new osmium.PrivateKey('testnet');
      var msg = new osmium.Message('hello osmium');
      var sig = msg.sign(pk);
      msg.verify(pk.toAddress(), sig).should.equal(true);
    });
  });

  describe('hash algorithm', function () {
    it('should expose Hash.x11 via the bound library', function () {
      osmium.crypto.Hash.x11.should.be.a('function');
    });

    it('should produce a deterministic hash for a known input', function () {
      var buf = Buffer.from('test', 'utf8');
      var h1 = osmium.crypto.Hash.x11(buf);
      var h2 = osmium.crypto.Hash.x11(buf);
      Buffer.isBuffer(h1).should.equal(true);
      h1.toString('hex').should.equal(h2.toString('hex'));
      h1.length.should.equal(32);
    });
  });

  describe('regtest switch', function () {
    it('should toggle regtest port/magic on the testnet network', function () {
      osmium.Networks.disableRegtest();
      osmium.Networks.testnet.port.should.equal(19969);

      osmium.Networks.enableRegtest();
      osmium.Networks.testnet.regtestEnabled.should.equal(true);

      osmium.Networks.disableRegtest();
      osmium.Networks.testnet.regtestEnabled.should.equal(false);
      osmium.Networks.testnet.port.should.equal(19969);
    });
  });
});