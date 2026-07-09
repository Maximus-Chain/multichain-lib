import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.js'],
    exclude: ['**/fixtures/**', '**/data/**', '**/browser*.spec.js', '**/browser*.e2e.spec.js', 'setup-require.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Use forks pool for better compatibility with crypto modules
    pool: 'forks',
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.js'],
      exclude: ['test/**', '**/*.test.js', '**/*.spec.js'],
    },
    // Alias for browser polyfills used in the project
    alias: {
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer/',
      path: 'path-browserify',
      url: 'url/',
      assert: 'assert-browserify',
    },
  },
});
