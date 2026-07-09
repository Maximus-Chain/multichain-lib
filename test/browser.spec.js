/**
 * Browser tests for maximus-lib
 *
 * This file contains tests that run in the browser using Vitest + Playwright.
 * Tests use ESM syntax (import/export).
 *
 * Note: This is a separate test file for browser-specific tests.
 * Legacy tests in the test/ directory use CommonJS and are designed for Node.js.
 * For full browser compatibility, consider migrating those tests to ESM.
 */

import { describe, it, expect } from 'vitest';
import * as bitcoreModule from '../index.js';

// Handle CommonJS module.exports
const lib = bitcoreModule.default || bitcoreModule;

describe('Browser Environment Tests', () => {
  describe('Library Loading', () => {
    it('should load the library successfully', () => {
      expect(lib).toBeDefined();
      expect(lib.Address).toBeDefined();
      expect(lib.PublicKey).toBeDefined();
      expect(lib.Networks).toBeDefined();
    });

    it('should have Networks defined', () => {
      expect(lib.Networks.livenet).toBeDefined();
      expect(lib.Networks.testnet).toBeDefined();
    });
  });

  describe('Address Validation', () => {
    it('should validate a correct livenet address', () => {
      const address = new lib.Address('MDPj1iqqCy23rLccUFvgC8HZq41fB8EH4y');
      expect(address).toBeDefined();
      expect(address.toString()).toBe('MDPj1iqqCy23rLccUFvgC8HZq41fB8EH4y');
    });

    it('should throw for invalid address', () => {
      expect(() => new lib.Address()).toThrow();
    });

    it('should validate P2PKH addresses', () => {
      const valid = lib.Address.isValid(
        'MDPj1iqqCy23rLccUFvgC8HZq41fB8EH4y',
        'livenet'
      );
      expect(valid).toBe(true);
    });

    it('should validate P2SH addresses', () => {
      const valid = lib.Address.isValid(
        '3Nzip9rw7pf94n7xdbb2y4EGQgsQu7WyEa',
        'livenet'
      );
      expect(valid).toBe(true);
    });
  });

  describe('PublicKey', () => {
    it('should create a public key', () => {
      const pk = new lib.PublicKey(
        '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004'
      );
      expect(pk).toBeDefined();
      expect(pk.toString()).toBe(
        '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004'
      );
    });

    it('should derive address from public key', () => {
      const pk = new lib.PublicKey(
        '0285e9737a74c30a873f74df05124f2aa6f53042c2fc0a130d6cbd7d16b944b004'
      );
      const address = lib.Address.fromPublicKey(pk, 'livenet');
      expect(address.toString()).toBe('MGaSKLcF37P8kZioK53oof5u7DLnap61qW');
    });
  });

  describe('Buffer Support', () => {
    it('should work with Buffer in browser', () => {
      const buffer = Buffer.from('hello world');
      expect(buffer.toString('utf8')).toBe('hello world');
    });
  });
});
