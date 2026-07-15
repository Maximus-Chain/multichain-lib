# Changelog

## 3.1.0

### Added

- **Per-network IPv6 service support for `ProRegTxPayload.service`.**
  Built-in chains can now opt in to accepting bracketed `[ipv6]:port`
  service strings in `ProRegTxPayload.service`. Internally they serialize
  as 16 raw IPv6 bytes (or, for IPv4 inputs, the existing IPv4-mapped
  form) followed by a 2-byte big-endian port, matching the Dash core wire
  format consumed by Pantheon/Maximus.
  - New optional `NetworkParameters.supportsIPv6?: boolean` flag. When
    `true`, both IPv4 and bracketed IPv6 service strings are accepted for
    that network; when `false` (the default for back-compat), only IPv4
    and the canonical empty-IPv6 form are accepted. Maximus livenet and
    testnet opt in; Osmium and any chain registered via
    `registerChain(...)` stay IPv4-only until they declare the flag.
  - New exports on `lib/util/ip.js`:
    `isIPV6(s)` (alias `isIPV6AndPort`) and `isIPAddressAndPort(s)`
    accept `ipv4:port` or `[ipv6]:port`. `ipv6StringToBuffer(ip)` and
    the internal serializer accept the standard `::` compression and an
    embedded IPv4 in the low 32 bits (`[::ffff:1.2.3.4]:9999`).
  - `bufferToIPAndPort` now recognizes non-mapped IPv6 buffers and
    returns them as `[ipv6]:port`, with the longest zero-run compressed
    to `::`. The all-zero buffer is still rendered as the canonical
    `[0:0:0:0:0:0:0:0]:<port>` string to match core.
  - `ProRegTxPayload#validate()` keeps the existing message
    (`Expected service to be a string with ip address and port`) for
    any IPv6 rejection on a chain without `supportsIPv6`, so callers
    don't need to differentiate the two cases.

### Tests

- `test/util/ip.js` covers `[2001:db8::1]:9999`, `[::1]:9999`,
  `[::ffff:1.2.3.4]:9999`, bare-IPv6 rejection, and round-trip
  IPv4/zero/IPv6 bytes.
- `test/isolated/transaction-payload.js` round-trips an IPv6
  `ProRegTxPayload` on Maximus and asserts Osmium (which does not
  declare `supportsIPv6`) rejects the same input.
- `test/chains/osmium.js` pins Osmium's `supportsIPv6` to
  `undefined` to lock in the default.
- `test/fixture-vite.e2e.spec.mjs` no longer pins the bundle's
  reported version to a patch string; it now only asserts that
  `version` is a non-empty string, so future major bumps don't break
  the Vite fixture.

## 3.0.4

### Fixed

- **CI: `test:browser` webServer timeout.** The Playwright config used to
  spawn `npm run --prefix examples/web/vite preview` directly. In CI,
  `npm ci` only resolves the parent package's dependencies, so `vite`
  was missing inside the fixture and the webServer silently died,
  producing the misleading
  `Error: Timed out waiting 180000ms from config.webServer`.
  The fixture webServer now runs `scripts/start-vite-fixture.sh`,
  which installs the fixture deps on demand, builds it if needed, and
  starts `vite preview`. The test is now self-bootstrapping in a
  fresh checkout.

## 3.0.3

### Fixed

- **Browser SPA crash on Vite/Rollup/Webpack** (`process.version is undefined`).
  Importing the package from a browser bundler no longer crashes at
  `_stream_writable.js:57` with
  `TypeError: can't access property "slice", process.version is undefined`.
  The resolution path now points browser bundlers at
  `dist/multichain-lib.mjs` (which already inlines the `process/browser`
  polyfill) instead of routing through `index.mjs` and the raw
  `ripemd160 → hash-base → readable-stream@2` CJS chain.
  - `package.json` exposes `dist/multichain-lib.mjs` via the new
    top-level `browser` field AND through `exports["."].browser`, with
    `browser` declared before `import` so conditional exports pick it
    first when the bundler activates the `browser` condition.
  - `module` and the `import`/`require`/`default` conditions continue to
    serve Node consumers from the source (`index.mjs` / `index.cjs`),
    where `process`, `Buffer`, `crypto` etc. are real built-ins.
  - Consumers do **not** need `vite-plugin-node-polyfills` or a manual
    `process` shim. The published package is self-contained.

### Added

- **`verify:bundle` npm script** (`scripts/verify-bundle.mjs`) that fails
  the build if `dist/multichain-lib.mjs` ever loses the
  `process.version = ''` polyfill cluster, or stops carrying the named
  root exports (`create`, `chains`, `registerChain`, `createHashRegistry`,
  `version`, `versionGuard`). Wired into `prepublishOnly` and the
  `test:browser` script. Codifies the invariant that makes the bundle
  safe in browsers.
- **Vite fixture regression test**
  (`examples/web/vite/` + `test/fixture-vite.e2e.spec.mjs`). Builds a
  minimal Vite app that imports the package by its public name and
  exercises the `Address.fromPublicKey` path that triggered the bug.
  Runs in Playwright against the local source via `file:../..` (and can
  be retargeted at an `npm pack` tarball). Confirms `pageerror === null`
  and a correct derived address.
- **Playwright `webServer` array** in `playwright.config.mjs`. Keeps the
  existing UMD bundle test on port 8080 and adds the Vite fixture on
  port 5173, so both suites run in CI without manual orchestration.

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
