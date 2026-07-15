/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

var expect = require('chai').expect;
var ip = require('../_setup').util.ip;
var constants = require('../_setup').util;

describe('ip', function () {
  describe('#ipAndPortToBuffer', function () {
    it('Should serialize ip and port to a buffer', function () {
      // c0a80001 - 192.168.0.1 as a hex string, 1771 is 6001 as UInt16BE
      var expectedBuffer = Buffer.from(
        '00000000000000000000ffffc0a800011771',
        'hex'
      );
      var addressBuffer = ip.ipAndPortToBuffer('192.168.0.1:6001');
      var string = addressBuffer.toString('hex');

      // 16 for ipv6, and 2 bytes for the port
      expect(addressBuffer.length).to.be.equal(18);
      expect(addressBuffer).to.be.deep.equal(expectedBuffer);
    });
    it('Should accept only zero ipv6, if ipv6 is passed as an arg', function () {
      var zeroaddressBuffer = ip.ipAndPortToBuffer('[::]:0');
      expect(zeroaddressBuffer.length).to.be.equal(18);
      expect(zeroaddressBuffer).to.be.deep.equal(Buffer.alloc(18));
      expect(ip.ipAndPortToBuffer.bind(this, 'not-an-ipv6:9999')).to.throw(
        'Only serialization of ipv4 and zero ipv6 is allowed'
      );
    });
    it('Should throw if a value that is not ipv4 or zero ipv6 string is passed', function () {
      expect(ip.ipAndPortToBuffer.bind(this, 'some string')).to.throw(
        'Only serialization of ipv4 and zero ipv6 is allowed'
      );
      expect(ip.ipAndPortToBuffer.bind(this, 2)).to.throw(
        'Only serialization of ipv4 and zero ipv6 is allowed'
      );
      expect(ip.ipAndPortToBuffer.bind(this, {})).to.throw(
        'Only serialization of ipv4 and zero ipv6 is allowed'
      );
      expect(ip.ipAndPortToBuffer.bind(this, '361.862.192.51:800')).to.throw(
        'Only serialization of ipv4 and zero ipv6 is allowed'
      );
      expect(ip.ipAndPortToBuffer.bind(this, '[not-an-ipv6]:9999')).to.throw(
        'Only serialization of ipv4 and zero ipv6 is allowed'
      );
      // A bare (unbracketed) IPv6 with port is rejected because the
      // service field requires the bracketed form.
      expect(ip.ipAndPortToBuffer.bind(this, '2001:db8::1:9999')).to.throw(
        'Only serialization of ipv4 and zero ipv6 is allowed'
      );
    });
    it('Should serialize a real ipv6 service to 16+2 bytes', function () {
      var buffer = ip.ipAndPortToBuffer('[2001:db8::1]:9999');
      expect(buffer.length).to.be.equal(18);
      expect(buffer.slice(0, 16).toString('hex')).to.be.equal(
        '20010db8000000000000000000000001'
      );
      expect(buffer.readUInt16BE(16)).to.be.equal(9999);
    });
    it('Should serialize ipv6 loopback', function () {
      var buffer = ip.ipAndPortToBuffer('[::1]:9999');
      expect(buffer.length).to.be.equal(18);
      expect(buffer.slice(0, 16).toString('hex')).to.be.equal(
        '00000000000000000000000000000001'
      );
    });
    it('Should serialize ipv4 embedded into ipv6 brackets', function () {
      var buffer = ip.ipAndPortToBuffer('[::ffff:1.2.3.4]:9999');
      expect(buffer.length).to.be.equal(18);
      expect(buffer.slice(0, 16).toString('hex')).to.be.equal(
        '00000000000000000000ffff01020304'
      );
    });
  });

  describe('#bufferToIpAndPort', function () {
    it('Should parse ip and port serialized to a binary', function () {
      var expectedAddressString = '192.168.0.1:6001';
      // c0a80001 - 192.168.0.1 as a hex string, 1771 is 6001 as UInt16BE
      var ipAndPortBuffer = Buffer.from(
        '00000000000000000000ffffc0a800011771',
        'hex'
      );

      var addressString = ip.bufferToIPAndPort(ipAndPortBuffer);
      expect(addressString).to.be.equal(expectedAddressString);
    });
    it('Should return zero ipv6 if hex is zero', function () {
      var zeroBuffer = Buffer.alloc(18);
      var ipAndPort = ip.bufferToIPAndPort(zeroBuffer);
      expect(ipAndPort).to.be.equal('[0:0:0:0:0:0:0:0]:0');
    });
    it('Should format a real ipv6 buffer as bracketed text', function () {
      var ipv6Buffer = Buffer.from(
        '20010db8000000000000000000000001270f',
        'hex'
      );
      expect(ip.bufferToIPAndPort(ipv6Buffer)).to.be.equal('[2001:db8::1]:9999');
    });
    it('Should compress the longest zero run in ipv6 output', function () {
      var allZeroExceptFirstAndLast = Buffer.alloc(16);
      allZeroExceptFirstAndLast.writeUInt16BE(0x2001, 0);
      allZeroExceptFirstAndLast.writeUInt16BE(0x1, 14);
      // 2001:0:0:0:0:0:0:1 → 2001::1
      expect(
        ip.bufferToIPAndPort(Buffer.concat([allZeroExceptFirstAndLast, Buffer.from([0x27, 0x0f])]))
      ).to.be.equal('[2001::1]:9999');
    });
    it('Should round-trip zero ipv6', function () {
      var buffer = ip.ipAndPortToBuffer('[::]:0');
      expect(ip.bufferToIPAndPort(buffer)).to.be.equal('[0:0:0:0:0:0:0:0]:0');
    });
    it('Should round-trip an ipv6 service string', function () {
      var original = '[2001:db8::1]:9999';
      var buffer = ip.ipAndPortToBuffer(original);
      expect(ip.bufferToIPAndPort(buffer)).to.be.equal(original);
    });
    it('Should round-trip an ipv4 service string', function () {
      var original = '1.2.3.4:9999';
      var buffer = ip.ipAndPortToBuffer(original);
      expect(ip.bufferToIPAndPort(buffer)).to.be.equal(original);
    });
    it('Should throw if buffer size is different from ip and port size', function () {
      expect(ip.bufferToIPAndPort.bind(this, Buffer.alloc(19))).to.throw(
        'Ip buffer has wrong size. Expected size is 18 bytes'
      );
      expect(ip.bufferToIPAndPort.bind(this, Buffer.alloc(17))).to.throw(
        'Ip buffer has wrong size. Expected size is 18 bytes'
      );
    });
  });

  describe('#isIPV6 / #isIPAddressAndPort', function () {
    it('Should reject bare ipv6 strings', function () {
      expect(ip.isIPV6('2001:db8::1:9999')).to.be.equal(false);
      expect(ip.isIPV6('2001:db8::1')).to.be.equal(false);
    });
    it('Should accept bracketed ipv6 with port', function () {
      expect(ip.isIPV6('[2001:db8::1]:9999')).to.be.equal(true);
      expect(ip.isIPV6('[::1]:9999')).to.be.equal(true);
      expect(ip.isIPV6('[::ffff:1.2.3.4]:9999')).to.be.equal(true);
    });
    it('Should accept ipv4 or ipv6 in isIPAddressAndPort', function () {
      expect(ip.isIPAddressAndPort('1.2.3.4:9999')).to.be.equal(true);
      expect(ip.isIPAddressAndPort('[::1]:9999')).to.be.equal(true);
      expect(ip.isIPAddressAndPort('not-an-ip:0')).to.be.equal(false);
    });
  });
});
