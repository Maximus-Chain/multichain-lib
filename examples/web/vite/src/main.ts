// Fixture entry. Uses the package through its public name so Vite resolves
// it via the `exports` map exactly like any real consumer would.
//
// `lib.Address.fromPublicKey` forces the sha256ripemd160 → ripemd160 →
// hash-base → readable-stream chain. If `package.json` doesn't steer
// bundlers to `dist/multichain-lib.mjs` (which inlines the
// process/browser polyfill), the page crashes with
//   TypeError: can't access property "slice", process.version is undefined
// at `_stream_writable.js:57`.
//
// We surface the outcome on `window.__FIXTURE_RESULT__` so the Playwright
// spec can read it without dealing with rendered DOM.

import {
  create,
  chains,
  version,
} from '@maximus-chain/multichain-lib';

interface FixtureResult {
  version: string;
  chains: string[];
  derivedAddress: string;
  expectedAddress: string;
  match: boolean;
}

function report(result: FixtureResult): void {
  const pre = document.getElementById('result');
  if (pre) {
    pre.textContent = JSON.stringify(result, null, 2);
  }
  (window as unknown as { __FIXTURE_RESULT__: FixtureResult }).__FIXTURE_RESULT__ = result;
}

try {
  const lib = create('maximus');
  const pk = new lib.PublicKey(
    '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004'
  );
  const derived = lib.Address.fromPublicKey(pk, 'livenet').toString();
  const expected = 'MGaSKLcF37P8kZioK53oof5u7DLnap61qW';

  report({
    version,
    chains: chains(),
    derivedAddress: derived,
    expectedAddress: expected,
    match: derived === expected,
  });
} catch (err) {
  report({
    version: '',
    chains: [],
    derivedAddress: '',
    expectedAddress: 'MGaSKLcF37P8kZioK53oof5u7DLnap61qW',
    match: false,
    // Cast to string so the report is JSON-serializable.
    ...({ error: String((err as Error)?.message ?? err) } as object),
  });
}