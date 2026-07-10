# Changelog

## Unreleased

### Added

- **ESM named exports.** The webpack ESM bundle (and the Node ESM entry) now
  expose each piece of the root API as a named export:
  `create`, `chains`, `registerChain`, `createHashRegistry`, `version`,
  `versionGuard`. The default export (the namespace as a whole) is still
  available for backward compatibility. `import { create } from
  '@maximus-chain/multichain-lib'` now works in any modern bundler.
- **Subpath exports per built-in chain.**
  `@maximus-chain/multichain-lib/chains/maximus` and
  `@maximus-chain/multichain-lib/chains/osmium` expose the chain config
  objects (the same shape passed to `registerChain`), with TypeScript types
  narrowed to the chain-specific `ChainLib` (`MaximusChainLib`,
  `OsmiumChainLib`).
- **Full TypeScript types for the v3 root API.** `index.d.ts` now declares
  the real root surface (`create`, `chains`, `registerChain`,
  `createHashRegistry`, `version`, `versionGuard`) with `create()`
  overloads so `create('maximus')` returns `MaximusChainLib`,
  `create('osmium')` returns `OsmiumChainLib`, and `create(<unknown>)`
  returns the generic `ChainLib`. The pre-v3 named-class exports
  (`Address`, `Transaction`, etc.) were removed from the type surface
  since they no longer exist at runtime.
- **Generic `ChainLib<C extends ChainConfig>` interface.** Reusable code can
  take `<C extends ChainLib>` (or `ChainLib`) and accept any chain —
  built-in or custom-registered — without losing type safety inside the
  body. See `docs/migration/v3.md` for examples.
- **New browser test** `bundle exposes named ESM exports` in
  `test/browser.e2e.spec.mjs`. Catches any future regression where the ESM
  bundle falls back to default-only.

### Fixed

- Pre-existing lint errors from the v3 commit (no-var, global-require,
  object-shorthand) in `lib/transaction/{index,output,unspentoutput}.js`.
- Browser end-to-end tests now target the v3 multi-instance isolation
  property (two `create('maximus')` calls have independent `Networks`,
  `Address`, and `crypto.Hash`; flipping one does not affect the other).
- `test/browser-test.html` uses named ESM imports directly, exposing the
  v2 default-only regression if it ever recurs.

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
