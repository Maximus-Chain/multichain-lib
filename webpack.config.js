const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const webFallbacks = {
  fs: false,
  crypto: require.resolve('crypto-browserify'),
  buffer: require.resolve('buffer/'),
  assert: require.resolve('assert-browserify'),
  stream: require.resolve('stream-browserify'),
  path: require.resolve('path-browserify'),
  url: require.resolve('url/'),
};

const webProvide = [
  new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
    process: ['process/browser'],
  }),
];

// Inject the library version at build time so the browser bundle
// doesn't need to read package.json (no node:fs polyfill required).
const versionDefine = new webpack.DefinePlugin({
  'globalThis.__MULTICHAIN_VERSION__': JSON.stringify(
    require('./package.json').version
  ),
});

// 1. UMD bundle for browsers via <script> tag.
//    `library: { type: 'umd' }` produces `window.multichain` (and a
//    CommonJS/AMD export for older bundlers). Internally webpack reads
//    the ESM entry and inlines its `export` declarations, so the global
//    object has the same shape as the ESM bundle.
const umdConfig = {
  entry: ['./index.mjs'],
  resolve: { fallback: webFallbacks },
  target: 'web',
  plugins: [...webProvide, versionDefine],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'multichain-lib.min.js',
    library: {
      name: 'multichain',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'this',
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: { output: { comments: false } },
        extractComments: false,
      }),
    ],
  },
};

// 2. ESM bundle for modern bundlers and `import` from a CDN.
//    `library: { type: 'module' }` plus an ESM entry causes webpack to
//    emit `export { __webpack_exports__ as default }` AND named
//    `export const ...` for each top-level export of the entry.
const esmConfig = {
  entry: ['./index.mjs'],
  resolve: { fallback: webFallbacks },
  target: 'web',
  plugins: [...webProvide, versionDefine],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'multichain-lib.mjs',
    library: { type: 'module' },
  },
  experiments: { outputModule: true },
  optimization: { minimize: false },
  mode: 'production',
};

module.exports = [umdConfig, esmConfig];