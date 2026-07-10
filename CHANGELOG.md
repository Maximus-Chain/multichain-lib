# Changelog

## 3.0.0

### Breaking changes

- `multichain.create(chainName)` is now always fully isolated: it no longer
  reads or mutates any shared, module-level state. Two chain-libs (for the
  same chain name or different ones) are completely independent and safe to
  use concurrently, including across `await` boundaries.
- `multichain.createIsolated(chainName)` has been removed — `create()` now
  does what it used to do. Replace calls to `createIsolated()` with `create()`.
- `multichain.registerAlgorithm(name, fn)` and `multichain.algorithms()` have
  been removed. Register custom hash algorithms per chain via
  `registerChain(name, { algorithms: {...} })` instead; inspect a chain's
  algorithms via its chain-lib's `crypto.Hash`.
- `lib/_context.js` (the global "active chain" singleton) has been deleted.
- `ECDSA.prototype.toPublicKey(PublicKeyClass)` and
  `Signer.verifyHashSignature(hash, signature, publicKeyId, PublicKeyClass)`
  now require an explicit, chain-bound `PublicKey` class (previously
  defaulted to a legacy singleton).
- `Signer.sign()` / `Signer.signHash()` now require `privateKey` to already
  be an instance of a chain's `PrivateKey` class (previously accepted a raw
  string).

See [docs/migration/v3.md](docs/migration/v3.md) for the full migration guide.

### Added

- Per-chain class factories throughout the library (`createAddressClass`,
  `createScriptClass`, `createHDPublicKeyClass`, `createHDPrivateKeyClass`,
  `createPrivateKeyClass`, `createPublicKeyClass`, `createMessageClass`,
  `createMnemonicClass`, `createInterpreterClass`, `createSighash`,
  `createTransactionClass`, `createTransactionSignatureClass`,
  `createOutputClass`, `createUnspentOutputClass`, `createInputClasses`,
  `createProRegTxPayloadClass`, `createPayloadClass`), each attached as a
  static property on the corresponding module's export, for advanced use
  cases that need direct access to a chain-bound class.
- `multichain.createHashRegistry()`: creates a standalone, isolated
  hash-algorithm registry, independent of any chain.

### Fixed

- `ECDSA#calci()` reuses the caller's own chain-bound `PublicKey` class
  during signature recovery, instead of depending on any legacy singleton.
- `ProRegTxPayload#verifySignature()`, `Transaction#to()` /
  `Transaction#change()`, and the entire `Transaction` input/output subsystem
  no longer depend on any global state.
