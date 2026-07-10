/**
 * Browser tests using Playwright with the ESM bundle.
 *
 * Verifies that the v3 chain-isolation model holds end-to-end inside the
 * webpack bundle: every `multichain.create(...)` call returns a ChainLib
 * with its own `Networks` and class closures, and the root module only
 * exposes `create`, `chains`, `registerChain`, `createHashRegistry`, and
 * `version`.
 */

import { test, expect } from '@playwright/test';

test.describe('Browser ESM Bundle Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/test/browser-test.html');
    await page.waitForFunction(() => typeof window.multichain !== 'undefined');
  });

  test('should load the library successfully', async ({ page }) => {
    const result = await page.evaluate(() => {
      const m = window.multichain;
      const lib = m.create('maximus');
      return {
        exists: typeof m !== 'undefined',
        hasCreate: typeof m.create === 'function',
        hasRegisterChain: typeof m.registerChain === 'function',
        hasCreateHashRegistry: typeof m.createHashRegistry === 'function',
        hasVersion: typeof m.version === 'string',
        chainsContainsMaximus: m.chains().indexOf('maximus') >= 0,
        chainsContainsOsmium: m.chains().indexOf('osmium') >= 0,
        chainHasX11Algorithm: lib.crypto.Hash.list().indexOf('x11') >= 0,
        hasAddress: typeof lib.Address !== 'undefined',
        hasPublicKey: typeof lib.PublicKey !== 'undefined',
        hasNetworks: typeof lib.Networks !== 'undefined',
        rootKeys: Object.keys(m).sort(),
      };
    });

    expect(result.exists).toBe(true);
    expect(result.hasCreate).toBe(true);
    expect(result.hasRegisterChain).toBe(true);
    expect(result.hasCreateHashRegistry).toBe(true);
    expect(result.hasVersion).toBe(true);
    expect(result.chainsContainsMaximus).toBe(true);
    expect(result.chainsContainsOsmium).toBe(true);
    expect(result.chainHasX11Algorithm).toBe(true);
    expect(result.hasAddress).toBe(true);
    expect(result.hasPublicKey).toBe(true);
    expect(result.hasNetworks).toBe(true);
    // The root module must expose at least these. `versionGuard` is also
    // expected — it's defined in `lib/_create.js` and re-exported by both
    // `index.mjs` and `index.cjs`.
    expect(result.rootKeys).toEqual(
      expect.arrayContaining([
        'create',
        'chains',
        'registerChain',
        'createHashRegistry',
        'version',
        'versionGuard',
      ])
    );
  });

  test('should have Networks defined', async ({ page }) => {
    const result = await page.evaluate(() => {
      const lib = window.multichain.create('maximus');
      return {
        hasLivenet: typeof lib.Networks.livenet !== 'undefined',
        hasTestnet: typeof lib.Networks.testnet !== 'undefined',
      };
    });

    expect(result.hasLivenet).toBe(true);
    expect(result.hasTestnet).toBe(true);
  });

  test('should validate a correct livenet address', async ({ page }) => {
    const result = await page.evaluate(() => {
      try {
        const lib = window.multichain.create('maximus');
        const address = new lib.Address('MDPj1iqqCy23rLccUFvgC8HZq41fB8EH4y');
        return {
          success: true,
          address: address.toString(),
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.address).toBe('MDPj1iqqCy23rLccUFvgC8HZq41fB8EH4y');
  });

  test('should throw for invalid address', async ({ page }) => {
    const result = await page.evaluate(() => {
      try {
        const lib = window.multichain.create('maximus');
        // Intentional side-effecting `new` to assert the constructor throws.
        // eslint-disable-next-line no-new
        new lib.Address();
        return { threw: false };
      } catch (e) {
        return { threw: true, message: e.message };
      }
    });

    expect(result.threw).toBe(true);
  });

  test('should validate P2PKH addresses', async ({ page }) => {
    const result = await page.evaluate(() => {
      const lib = window.multichain.create('maximus');
      return lib.Address.isValid('MDPj1iqqCy23rLccUFvgC8HZq41fB8EH4y', 'livenet');
    });

    expect(result).toBe(true);
  });

  test('should validate P2SH addresses', async ({ page }) => {
    const result = await page.evaluate(() => {
      const lib = window.multichain.create('maximus');
      return lib.Address.isValid('3Nzip9rw7pf94n7xdbb2y4EGQgsQu7WyEa', 'livenet');
    });

    expect(result).toBe(true);
  });

  test('should create a public key', async ({ page }) => {
    const result = await page.evaluate(() => {
      try {
        const lib = window.multichain.create('maximus');
        const pk = new lib.PublicKey(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004'
        );
        return {
          success: true,
          pkString: pk.toString(),
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.pkString).toBe(
      '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004'
    );
  });

  test('should derive address from public key', async ({ page }) => {
    const result = await page.evaluate(() => {
      try {
        const lib = window.multichain.create('maximus');
        const pk = new lib.PublicKey(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004'
        );
        const address = lib.Address.fromPublicKey(pk, 'livenet');
        return {
          success: true,
          address: address.toString(),
        };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });

    expect(result.success).toBe(true);
    expect(result.address).toBe('MGaSKLcF37P8kZioK53oof5u7DLnap61qW');
  });

  test('isolates two maximus instances', async ({ page }) => {
    const result = await page.evaluate(() => {
      const m = window.multichain;
      const a = m.create('maximus');
      const b = m.create('maximus');

      const beforeA = a.Networks.getActive().name;
      const beforeB = b.Networks.getActive().name;

      a.Networks.setActive('testnet');

      const afterA = a.Networks.getActive().name;
      const afterB = b.Networks.getActive().name;

      return {
        distinctNetworks: a.Networks !== b.Networks,
        distinctAddress: a.Address !== b.Address,
        distinctHashRegistry: a.crypto.Hash !== b.crypto.Hash,
        sameChainName: a.chainName === b.chainName && a.chainName === 'maximus',
        bothStartedOnLivenet: beforeA === 'livenet' && beforeB === 'livenet',
        aFlippedToTestnet: afterA === 'testnet',
        bUnaffected: afterB === 'livenet',
      };
    });

    expect(result.distinctNetworks).toBe(true);
    expect(result.distinctAddress).toBe(true);
    expect(result.distinctHashRegistry).toBe(true);
    expect(result.sameChainName).toBe(true);
    expect(result.bothStartedOnLivenet).toBe(true);
    expect(result.aFlippedToTestnet).toBe(true);
    expect(result.bUnaffected).toBe(true);
  });

  test('supports osmium chain', async ({ page }) => {
    const result = await page.evaluate(() => {
      const m = window.multichain.create('osmium');
      const max = window.multichain.create('maximus');
      return {
        hasOsmiumAlgorithms: m.crypto.Hash.list().indexOf('x11') >= 0,
        osmiumPubkeyhashPrefix: m.Networks.livenet.pubkeyhash,
        maximusPubkeyhashPrefix: max.Networks.livenet.pubkeyhash,
        distinctAcrossChains: m.Networks !== max.Networks,
        distinctAddressAcrossChains: m.Address !== max.Address,
        hasTransaction: typeof m.Transaction !== 'undefined',
        hasProRegTxPayload: typeof m.ProRegTxPayload !== 'undefined',
      };
    });

    expect(result.hasOsmiumAlgorithms).toBe(true);
    expect(result.osmiumPubkeyhashPrefix).toBe(63);
    expect(result.maximusPubkeyhashPrefix).toBe(50);
    expect(result.distinctAcrossChains).toBe(true);
    expect(result.distinctAddressAcrossChains).toBe(true);
    expect(result.hasTransaction).toBe(true);
    expect(result.hasProRegTxPayload).toBe(true);
  });

  test('exposes createHashRegistry on the root module', async ({ page }) => {
    const result = await page.evaluate(() => {
      const reg = window.multichain.createHashRegistry();
      const keys = Object.keys(reg).sort();
      const baseKeys = ['get', 'hmac', 'list', 'register', 'ripemd160', 'sha1', 'sha256', 'sha256hmac', 'sha256ripemd160', 'sha256sha256', 'sha512', 'sha512hmac', 'x11', 'forNetwork'];
      // Register a deterministic identity algorithm that doesn't need Buffer
      // (Buffer isn't a global in the page context even though webpack
      // injects it inside the bundle).
      reg.register('custom', function doubleString(s) {
        return String(s) + String(s);
      });
      return {
        hasRegister: typeof reg.register === 'function',
        hasList: typeof reg.list === 'function',
        hasGet: typeof reg.get === 'function',
        hasForNetwork: typeof reg.forNetwork === 'function',
        hasBaseKeys: baseKeys.every(function (k) { return keys.indexOf(k) >= 0; }),
        registeredCustomAlgorithm: reg.list().indexOf('custom') >= 0,
        customAlgorithmWorks: reg.get('custom')('hi') === 'hihi',
      };
    });

    expect(result.hasRegister).toBe(true);
    expect(result.hasList).toBe(true);
    expect(result.hasGet).toBe(true);
    expect(result.hasForNetwork).toBe(true);
    expect(result.hasBaseKeys).toBe(true);
    expect(result.registeredCustomAlgorithm).toBe(true);
    expect(result.customAlgorithmWorks).toBe(true);
  });

  test('bundle exposes named ESM exports', async ({ page }) => {
    // Load the bundle in a fresh page and import each named export
    // directly. This catches the v2 regression where webpack's ESM
    // mode only emitted a default export.
    await page.goto('http://localhost:8080/test/browser-test.html');
    await page.waitForFunction(() => typeof window.multichain !== 'undefined');
    const result = await page.evaluate(async () => {
      const lib = await import('/dist/multichain-lib.mjs');
      return {
        hasCreate: typeof lib.create === 'function',
        hasChains: typeof lib.chains === 'function',
        hasRegisterChain: typeof lib.registerChain === 'function',
        hasCreateHashRegistry: typeof lib.createHashRegistry === 'function',
        hasVersion: typeof lib.version === 'string',
        hasDefault: typeof lib.default === 'object',
        chainsList: lib.chains(),
        canInstantiateViaNamedImport: (() => {
          const m = lib.create('maximus');
          return typeof m.Address === 'function' && m.chainName === 'maximus';
        })(),
      };
    });

    expect(result.hasCreate).toBe(true);
    expect(result.hasChains).toBe(true);
    expect(result.hasRegisterChain).toBe(true);
    expect(result.hasCreateHashRegistry).toBe(true);
    expect(result.hasVersion).toBe(true);
    expect(result.hasDefault).toBe(true);
    expect(result.chainsList).toEqual(['maximus', 'osmium']);
    expect(result.canInstantiateViaNamedImport).toBe(true);
  });
});