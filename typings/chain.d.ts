import { Address } from './Address';
import { HDPrivateKey } from './HDPrivateKey';
import { HDPublicKey } from './HDPublicKey';
import { Message } from './Message';
import { Networks } from './Network';
import { PrivateKey } from './PrivateKey';
import { PublicKey } from './PublicKey';
import { Script } from './script/Script';
import { Transaction } from './transaction/Transaction';
import { ProRegTxPayload } from './transaction/payload/ProRegTxPayload';
import { Output } from './transaction/Output';
import { UnspentOutput } from './transaction/UnspentOutput';
import { TransactionSignature } from './transaction/TransactionSignature';
import { Input } from './transaction/input/Input';
import { MultiSigInput } from './transaction/input/MultiSigInput';
import { MultiSigScriptHashInput } from './transaction/input/MultiSigScriptHashInput';
import { AbstractPayload } from './transaction/payload/AbstractPayload';
import { Mnemonic } from './mnemonic/Mnemonic';
import { Unit } from './Unit';
import { BN } from './crypto/BN';
import { Point } from './crypto/Point';
import { Signature } from './crypto/Signature';
import { Hash } from './crypto/Hash';
import { BufferWriter } from './buffer/BufferWriter';
import { BufferReader } from './buffer/BufferReader';

/**
 * Configuration object passed to `registerChain(name, config)` and used
 * internally by `create(name)` to bind a Networks instance, declare
 * per-chain hash algorithms, etc.
 */
export interface ChainConfig {
  /** Human-readable chain identifier (e.g. `"maximus"`, `"osmium"`). */
  name: string;
  /** Magic prefix used when signing messages (e.g. `"MaximusCoin Signed Message:\n"`). */
  messageMagic: string;
  /** Optional map of hash algorithm name → function. Per-chain, isolated at runtime. */
  algorithms?: Record<string, (buf: Buffer) => Buffer>;
  /** Livenet Network parameters. */
  livenet: NetworkParameters;
  /** Testnet Network parameters. */
  testnet: NetworkParameters;
}

export interface NetworkParameters {
  name: string;
  alias?: string | string[];
  pubkeyhash: number;
  privatekey: number;
  scripthash: number;
  xpubkey: number;
  xprivkey: number;
  xpubkey256bit?: number;
  xprivkey256bit?: number;
  networkMagic?: Buffer;
  port?: number;
  dnsSeeds?: string[];
  messageMagic?: string;
  hashFunction?: string | ((buf: Buffer) => Buffer);
  /**
   * Set to `true` to allow IPv6 service addresses (in the `[ipv6]:port`
   * form) in `ProRegTxPayload.service`. Defaults to `false` when omitted,
   * preserving the legacy IPv4-only behavior.
   */
  supportsIPv6?: boolean;
  regtestEnabled?: boolean;
}

export interface HashRegistry {
  sha1(buf: Buffer): Buffer;
  sha256(buf: Buffer): Buffer;
  sha256sha256(buf: Buffer): Buffer;
  ripemd160(buf: Buffer): Buffer;
  sha256ripemd160(buf: Buffer): Buffer;
  sha512(buf: Buffer): Buffer;
  hmac(...args: any[]): Buffer;
  sha256hmac(...args: any[]): Buffer;
  sha512hmac(...args: any[]): Buffer;
  x11(buf: Buffer): Buffer;
  forNetwork(buf: Buffer, network?: { hashFunction?: string | ((b: Buffer) => Buffer) }): Buffer;
  register(name: string, fn: (buf: Buffer) => Buffer): void;
  registerAlgorithm(name: string, fn: (buf: Buffer) => Buffer): void;
  get(name: string): (buf: Buffer) => Buffer;
  getAlgorithm(name: string): (buf: Buffer) => Buffer;
  list(): string[];
  listAlgorithms(): string[];
}

export interface CryptoNamespace {
  BN: typeof BN;
  ECDSA: any;
  Hash: HashRegistry;
  Random: any;
  Point: typeof Point;
  Signature: typeof Signature;
  BLS: any;
  Signer: any;
}

export interface EncodingNamespace {
  Base58: any;
  Base58Check: any;
  BufferReader: typeof BufferReader;
  BufferWriter: typeof BufferWriter;
  Varint: any;
}

export interface UtilNamespace {
  buffer: any;
  js: any;
  preconditions: any;
  bitarray: any;
  ip: any;
  isHashQuorumIndexRequired: any;
}

/**
 * A `ChainLib` is the closed-over set of classes bound to a specific
 * chain. Created by `create(name)`. Every call returns a fresh instance
 * with its own `Networks`, hash registry, and class closures, so two
 * ChainLibs (even for the same chain name) never share state.
 *
 * The generic `C` lets TypeScript narrow `chainName` and friends on
 * a per-chain basis (e.g. `ChainLib<MaximusConfig>`). Code that wants
 * to be reusable across chains uses `ChainLib` (default = any chain)
 * or `ChainLib<ChainConfig>` and lets the call site pass in the lib.
 */
export interface ChainLib<C extends ChainConfig = ChainConfig> {
  /** The chain name passed to `create()` or declared in `ChainConfig.name`. */
  chainName: C['name'];
  Networks: typeof Networks;

  Address: typeof Address;
  Script: typeof Script;
  HDPublicKey: typeof HDPublicKey;
  HDPrivateKey: typeof HDPrivateKey;
  PrivateKey: typeof PrivateKey;
  PublicKey: typeof PublicKey;
  Message: typeof Message;

  Transaction: typeof Transaction;
  ProRegTxPayload: typeof ProRegTxPayload;

  Unit: typeof Unit;
  Mnemonic: typeof Mnemonic;
  Opcode: any;

  crypto: CryptoNamespace;
  encoding: EncodingNamespace;
  util: UtilNamespace;
  errors: any;
}

/** Re-exported types so consumers can write reusable signatures like
 *  `function f(lib: ChainLib) { return new lib.PrivateKey(); }`. */
export type AnyChainLib = ChainLib<ChainConfig>;