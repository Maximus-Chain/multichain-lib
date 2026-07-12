/**
 * Vite fixture regression test.
 *
 * Builds `examples/web/vite` (which imports the package via its public
 * name, forcing Vite to resolve `dist/multichain-lib.mjs` through the
 * `browser` conditional export), serves it with `vite preview`, and
 * asserts that:
 *
 *   1. No `pageerror` is emitted on load. Before the fix the page would
 *      crash with
 *        TypeError: can't access property "slice", process.version is undefined
 *        at _stream_writable.js:57
 *      the moment `Address.fromPublicKey` walked into the
 *      ripemd160 → hash-base → readable-stream@2 chain.
 *   2. The fixture reports the expected derived address.
 *
 * If you only want the in-tree UMD bundle test, run `npm run test:browser`
 * without arguments and it will pick up `browser.e2e.spec.mjs`. This
 * fixture is in addition to that, exercising the SAME library from the
 * perspective of a real Vite consumer.
 */

import { test, expect } from '@playwright/test';

const FIXTURE_URL = process.env.FIXTURE_URL ?? 'http://localhost:5173';

test.describe('Vite fixture (@maximus-chain/multichain-lib resolution)', () => {
  test('imports the package through Vite without crashing and derives the expected address', async ({
    page,
  }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e));

    await page.goto(FIXTURE_URL, { waitUntil: 'load' });

    await page.waitForFunction(
      () =>
        typeof window.__FIXTURE_RESULT__ !== 'undefined',
      null,
      { timeout: 30000 }
    );

    const result = await page.evaluate(
      () =>
        /** @type {{
          version: string,
          chains: string[],
          derivedAddress: string,
          expectedAddress: string,
          match: boolean,
          error?: string,
        }} */ (window.__FIXTURE_RESULT__)
    );

    expect(
      errors,
      `page emitted ${errors.length} error(s): ${errors
        .map((e) => e.message)
        .join('; ')}`
    ).toHaveLength(0);
    expect(result.error ?? '').toBe('');
    expect(result.version).toMatch(/^v3\.0\.4/);
    expect(result.chains).toEqual(expect.arrayContaining(['maximus', 'osmium']));
    expect(result.derivedAddress).toBe(result.expectedAddress);
    expect(result.match).toBe(true);
  });
});