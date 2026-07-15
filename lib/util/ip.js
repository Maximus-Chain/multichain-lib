/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

var BufferWriter = require('../encoding/bufferwriter');
var BufferReader = require('../encoding/bufferreader');
var constants = require('../constants');

// ipv4:port
var ipv4Regex =
  /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/;

// [ipv6]:port — bracketed IPv6 + ":port". Accepts uppercase/lowercase hex,
// '::' compression (single occurrence), and an optional embedded IPv4 in
// the low 32 bits (RFC 4291 §2.5.5.2, e.g. "::ffff:1.2.3.4").
var ipv6Regex = /^\[([0-9A-Fa-f:.]+)\]:[0-9]+$/;

var ipV6prefix = Buffer.from('00000000000000000000ffff', 'hex');
var emptyAddress = Buffer.alloc(18);
var EMPTY_FULL_IPV6_ADDRESS = '[0:0:0:0:0:0:0:0]:0';
var EMPTY_SHORT_IPV6_ADDRESS = '[::]:0';
var EMPTY_SHORT_ZERO_IPV6_ADDRESS = '[::0]:0';
var EMPTY_FULL_IPV4_ADDRESS = '0.0.0.0:0';
var EMPTY_SHORT_IPV4_ADDRESS = '0:0';
var EMPTY_ADDRESSES = [
  EMPTY_FULL_IPV6_ADDRESS,
  EMPTY_SHORT_IPV6_ADDRESS,
  EMPTY_SHORT_ZERO_IPV6_ADDRESS,
  EMPTY_FULL_IPV4_ADDRESS,
  EMPTY_SHORT_IPV4_ADDRESS,
];

/**
 * Parses an IPv6 address (no surrounding brackets, no port) to a 16-byte
 * Buffer. Handles `::` compression and an embedded IPv4 in the low 32 bits.
 * @param {string} ip
 * @return {Buffer}
 */
function ipv6StringToBuffer(ip) {
  if (typeof ip !== 'string' || ip.length === 0) {
    throw new Error('Invalid IPv6 address: ' + ip);
  }
  var ipv4Bytes = null;
  var lastColon = ip.lastIndexOf(':');
  var tail = ip.slice(lastColon + 1);
  if (tail.indexOf('.') !== -1) {
    var octets = tail.split('.').map(Number);
    if (
      octets.length !== 4 ||
      octets.some(function (o) {
        return isNaN(o) || o < 0 || o > 255;
      })
    ) {
      throw new Error('Invalid embedded IPv4 in IPv6: ' + ip);
    }
    ipv4Bytes = octets;
    // Replace the dotted tail with two hex words. This keeps the resulting
    // string pure-colon so the `::` compression logic only sees hex groups.
    ip =
      ip.slice(0, lastColon + 1) +
      ((octets[0] << 8) | octets[1]).toString(16) +
      ':' +
      ((octets[2] << 8) | octets[3]).toString(16);
  }

  var groups = ip.split(':');
  var hasDoubleColon = ip.indexOf('::') !== -1;
  if (hasDoubleColon && ip.split('::').length > 2) {
    throw new Error('Invalid IPv6 (multiple ::): ' + ip);
  }

  var filled = groups.filter(function (g) {
    return g !== '';
  });
  var totalSlots = 8;
  if (filled.length > totalSlots) {
    throw new Error('Invalid IPv6 (too many groups): ' + ip);
  }

  var zerosToInsert = hasDoubleColon ? totalSlots - filled.length : 0;
  var output = [];
  var sawEmpty = false;
  for (var j = 0; j < groups.length; j++) {
    var group = groups[j];
    if (group === '') {
      sawEmpty = true;
      if (!hasDoubleColon) {
        throw new Error('Invalid IPv6 (empty group without ::): ' + ip);
      }
      continue;
    }
    if (group.length > 4) {
      throw new Error('Invalid IPv6 group: ' + group);
    }
    var word = parseInt(group, 16);
    if (isNaN(word)) {
      throw new Error('Invalid IPv6 group: ' + group);
    }
    output.push(word);
  }
  if (!sawEmpty && !hasDoubleColon) {
    if (output.length !== totalSlots) {
      throw new Error('Invalid IPv6 (need 8 groups or one ::): ' + ip);
    }
  }
  if (hasDoubleColon) {
    // Insert the zero-run exactly once at the position of the '::' marker.
    var inserted = 0;
    var finalOutput = [];
    for (var k = 0; k < groups.length; k++) {
      var g = groups[k];
      if (g === '') {
        if (inserted === 0) {
          for (var z = 0; z < zerosToInsert; z++) finalOutput.push(0);
          inserted = zerosToInsert;
        }
        continue;
      }
      finalOutput.push(parseInt(g, 16));
    }
    // Trailing '::' (e.g. "1::") means the empty group is at the end.
    if (groups[groups.length - 1] === '' && inserted < zerosToInsert) {
      for (var z2 = 0; z2 < zerosToInsert - inserted; z2++) {
        finalOutput.push(0);
      }
    }
    output = finalOutput;
  }
  if (output.length !== totalSlots) {
    throw new Error('Invalid IPv6 (need 8 groups or one ::): ' + ip);
  }
  var buf = Buffer.alloc(16);
  for (var w = 0; w < totalSlots; w++) {
    buf.writeUInt16BE(output[w], w * 2);
  }
  return buf;
}

function isIPv4Mapped(buffer) {
  // Legacy convention: IPv4-mapped IPv6 = first 10 bytes zero + 0xffff.
  for (var i = 0; i < 10; i++) {
    if (buffer[i] !== 0) return false;
  }
  return buffer[10] === 0xff && buffer[11] === 0xff;
}

/**
 * Maps `ipv4:port` or `[ipv6]:port` to a 16-byte IPv6 buffer and 2-byte port.
 * IPv4 addresses are encoded as IPv4-mapped IPv6 (::ffff:a.b.c.d) to match
 * the existing wire format. Real IPv6 inputs are written as 16 raw bytes
 * followed by a 2-byte big-endian port.
 * @param {string} string
 * @return {Buffer}
 */
function ipAndPortToBuffer(string) {
  if (isZeroAddress(string)) {
    return emptyAddress.slice();
  }
  if (isIpV4(string)) {
    var addressParts = string.split(':');
    var addressBytes = addressParts[0].split('.').map(Number);
    var port = Number(addressParts[1]);

    var bufferWriter = new BufferWriter();
    bufferWriter.write(ipV6prefix);
    bufferWriter.write(Buffer.from(addressBytes));
    bufferWriter.writeUInt16BE(port);
    return bufferWriter.toBuffer();
  }
  if (isIPV6AndPort(string)) {
    var match = string.match(ipv6Regex);
    var ip = match[1];
    var closingBracket = string.lastIndexOf(']:');
    var port6 = Number(string.slice(closingBracket + 2));

    var ipv6Writer = new BufferWriter();
    ipv6Writer.write(ipv6StringToBuffer(ip));
    ipv6Writer.writeUInt16BE(port6);
    return ipv6Writer.toBuffer();
  }
  throw new Error('Only serialization of ipv4 and zero ipv6 is allowed');
}

/**
 * Parses an 18-byte ip+port buffer to an `ipv4:port` string when the buffer
 * is an IPv4-mapped IPv6 address, or to a `[ipv6]:port` string when it is
 * a real IPv6 address.
 * @param {Buffer} buffer
 * @return {string}
 */
function bufferToIPAndPort(buffer) {
  if (buffer.length !== 18) {
    throw new Error('Ip buffer has wrong size. Expected size is 18 bytes');
  }
  var bufferReader = new BufferReader(buffer);
  var ipV6Buffer = bufferReader.read(constants.IP_ADDRESS_SIZE);
  var port = bufferReader.readUInt16BE();

  var isAllZero = true;
  for (var z = 0; z < 16; z++) {
    if (ipV6Buffer[z] !== 0) {
      isAllZero = false;
      break;
    }
  }
  if (isAllZero) {
    // Empty service buffer renders as the canonical "[0:0:...]:<port>" form,
    // mirroring Dash core's determinstic-masternode-list JSON output.
    return '[0:0:0:0:0:0:0:0]:' + port;
  }

  if (isIPv4Mapped(ipV6Buffer)) {
    var ipV4DecimalBytes = Array.prototype.slice.call(
      ipV6Buffer.slice(12, 16)
    );
    var ipV4string = ipV4DecimalBytes.join('.');
    return ipV4string + ':' + String(port);
  }

  var groups = [];
  for (var i = 0; i < 8; i++) {
    groups.push(ipV6Buffer.readUInt16BE(i * 2).toString(16));
  }
  var bestStart = -1;
  var bestLen = 0;
  var curStart = -1;
  var curLen = 0;
  for (var j = 0; j < 8; j++) {
    if (groups[j] === '0') {
      if (curStart === -1) {
        curStart = j;
        curLen = 1;
      } else {
        curLen++;
      }
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }
  var rendered;
  if (bestLen >= 2 && bestStart !== -1) {
    var head = groups.slice(0, bestStart).join(':');
    var tail = groups.slice(bestStart + bestLen).join(':');
    rendered = head + '::' + tail;
    // Trim a single trailing ':' (e.g. "1::"), but keep '::' empty case.
    if (
      rendered.length > 2 &&
      rendered.charAt(rendered.length - 1) === ':' &&
      rendered.charAt(rendered.length - 2) !== ':'
    ) {
      rendered = rendered.slice(0, -1);
    }
    if (rendered.length > 2 && rendered.charAt(0) === ':' && rendered.charAt(1) !== ':') {
      rendered = rendered.slice(1);
    }
  } else {
    rendered = groups.join(':');
  }
  return '[' + rendered + ']:' + port;
}

/**
 * Checks if string is an ipv4 address with port
 * @param {string} ipAndPortString
 * @return {boolean}
 */
function isIpV4(ipAndPortString) {
  return ipv4Regex.test(ipAndPortString);
}

/**
 * Checks if string is a bracketed ipv6 address with port (e.g. "[::1]:9999")
 * @param {string} ipAndPortString
 * @return {boolean}
 */
function isIPV6AndPort(ipAndPortString) {
  if (typeof ipAndPortString !== 'string') return false;
  if (ipAndPortString.charAt(0) !== '[') return false;
  var match = ipAndPortString.match(ipv6Regex);
  if (!match) return false;
  if (match[1] === '') return false;
  try {
    ipv6StringToBuffer(match[1]);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Combined IPv4-or-IPv6 service check; accepts `ipv4:port` and `[ipv6]:port`.
 * @param {string} ipAndPortString
 * @return {boolean}
 */
function isIPAddressAndPort(ipAndPortString) {
  return isIpV4(ipAndPortString) || isIPV6AndPort(ipAndPortString);
}

/**
 * @param {string} address
 * @return {boolean}
 */
function isZeroAddress(address) {
  return EMPTY_ADDRESSES.includes(address);
}

var ip = {
  isIPV4: isIpV4,
  isIPV6: isIPV6AndPort,
  isIPAddressAndPort: isIPAddressAndPort,
  ipv6StringToBuffer: ipv6StringToBuffer,
  ipAndPortToBuffer: ipAndPortToBuffer,
  bufferToIPAndPort: bufferToIPAndPort,
  isZeroAddress: isZeroAddress,
  IP_AND_PORT_SIZE:
    constants.ipAddresses.IPV4MAPPEDHOST + constants.ipAddresses.PORT,
};

module.exports = ip;
