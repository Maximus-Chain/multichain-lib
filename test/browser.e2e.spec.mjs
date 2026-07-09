/**
 * Browser tests using Playwright with the ESM bundle
 */

import { test, expect } from '@playwright/test';

test.describe('Browser ESM Bundle Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load the ESM bundle via a test HTML page served by http-server
    await page.goto('http://localhost:8080/test/browser-test.html');
  });

  test('should load the library successfully', async ({ page }) => {
    const result = await page.evaluate(() => {
      return {
        exists: typeof maximuscore !== 'undefined',
        hasAddress: typeof maximuscore.Address !== 'undefined',
        hasPublicKey: typeof maximuscore.PublicKey !== 'undefined',
        hasNetworks: typeof maximuscore.Networks !== 'undefined',
      };
    });

    expect(result.exists).toBe(true);
    expect(result.hasAddress).toBe(true);
    expect(result.hasPublicKey).toBe(true);
    expect(result.hasNetworks).toBe(true);
  });

  test('should have Networks defined', async ({ page }) => {
    const result = await page.evaluate(() => {
      return {
        hasLivenet: typeof maximuscore.Networks.livenet !== 'undefined',
        hasTestnet: typeof maximuscore.Networks.testnet !== 'undefined',
      };
    });

    expect(result.hasLivenet).toBe(true);
    expect(result.hasTestnet).toBe(true);
  });

  test('should validate a correct livenet address', async ({ page }) => {
    const result = await page.evaluate(() => {
      try {
        const address = new maximuscore.Address(
          'MDPj1iqqCy23rLccUFvgC8HZq41fB8EH4y',
        );
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
        new maximuscore.Address();
        return { threw: false };
      } catch (e) {
        return { threw: true, message: e.message };
      }
    });

    expect(result.threw).toBe(true);
  });

  test('should validate P2PKH addresses', async ({ page }) => {
    const result = await page.evaluate(() => {
      return maximuscore.Address.isValid(
        'MDPj1iqqCy23rLccUFvgC8HZq41fB8EH4y',
        'livenet',
      );
    });

    expect(result).toBe(true);
  });

  test('should validate P2SH addresses', async ({ page }) => {
    const result = await page.evaluate(() => {
      return maximuscore.Address.isValid(
        '3Nzip9rw7pf94n7xdbb2y4EGQgsQu7WyEa',
        'livenet',
      );
    });

    expect(result).toBe(true);
  });

  test('should create a public key', async ({ page }) => {
    const result = await page.evaluate(() => {
      try {
        const pk = new maximuscore.PublicKey(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
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
      '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
    );
  });

  test('should derive address from public key', async ({ page }) => {
    const result = await page.evaluate(() => {
      try {
        const pk = new maximuscore.PublicKey(
          '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004',
        );
        const address = maximuscore.Address.fromPublicKey(pk, 'livenet');
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
});
