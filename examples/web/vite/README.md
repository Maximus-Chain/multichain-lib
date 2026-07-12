# `@maximus-chain/multichain-lib` — Vite fixture

This fixture reproduces the browser bug that motivated the `browser` /
`exports["."].browser` entry points added in `@maximus-chain/multichain-lib@3.0.3`.

## What it does

```ts
import { create, chains, version } from '@maximus-chain/multichain-lib';

const lib = create('maximus');
const pk = new lib.PublicKey('0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004');
const derived = lib.Address.fromPublicKey(pk, 'livenet').toString();
// → 'MGaSKLcF37P8kZioK53oof5u7DLnap61qW'
```

`Address.fromPublicKey` calls `Hash.sha256ripemd160`, which calls
`ripemd160 → hash-base → readable-stream@2 → lib/_stream_writable.js`. On
the unfixed package Vite resolves `@maximus-chain/multichain-lib` to
`index.mjs`, the readable-stream CJS branch executes at module top-level
without `process` defined, and the page crashes:

```
TypeError: can't access property "slice", process.version is undefined
  at _stream_writable.js:57
```

After the fix, Vite resolves to `dist/multichain-lib.mjs`, which already
inlines the `process/browser` polyfill (`process.version = ''`,
`process.browser = true`) BEFORE the readable-stream code runs.

## Usage

```bash
# from the package root (one level up):
cd examples/web/vite
npm install            # installs vite + the parent package via file:../..
npm run build          # builds a production bundle into ./dist
npm run preview        # serves it on http://localhost:5173
```

Then open the page; the `<pre id="result">` element is populated with the
JSON `{ version, chains, derivedAddress, expectedAddress, match }`. When
`match` is `true` the fixture is healthy.

The Playwright spec at
`test/fixture-vite.e2e.spec.mjs` runs this fixture in CI and asserts
`pageerror === null` plus a successful `derivedAddress`.

## Notes

- No `vite-plugin-node-polyfills`. The whole point is to prove the
  published library is self-contained.
- `optimizeDeps.include` forces Vite to pre-bundle the package so the
  internal `require('ripemd160')` chain is resolved through Vite's
  dep optimizer, matching what real consumer apps do.
- The dependency is `file:../..` so the fixture is always tested against
  the local source. To test against an `npm pack` tarball, run
  `npm pack` at the package root and change the `dependencies` entry to
  `"@maximus-chain/multichain-lib": "file:../../maximus-chain-multichain-lib-3.0.3.tgz"`.