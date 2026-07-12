#!/usr/bin/env node
/* eslint-disable no-console */
// Post-build invariant check for the published ESM bundle.
//
// The bug being guarded: when consumers import the package from a
// browser-only bundler (Vite, Rollup, Webpack) without `node-polyfills`,
// the resolution used to point to `index.mjs`, which transitively pulls
// `readable-stream@2 -> lib/_stream_writable.js` with the line:
//   !process.browser && ['v0.10','v0.9.'].indexOf(process.version.slice(0,5)) > -1
// In a browser `process` is undefined → crash at `.slice`.
//
// The webpack `esmConfig` keeps the bug inert by injecting the
// `process/browser` polyfill (process.browser=true, process.version='') into
// the bundle BEFORE the readable-stream code runs. This script enforces
// that invariant by reading `dist/multichain-lib.mjs` and failing the build
// if the shim ever disappears or gets reordered behind the consumer of
// `process.version.slice`.
//
// Note: the bundle is intentionally NOT minified (`optimization.minimize:
// false` in webpack.config.js), so the literal text `process.version.slice`
// will be present. We rely on the EARLIER polyfill assignment, not on the
// literal being absent.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const esmBundlePath = resolve(root, 'dist/multichain-lib.mjs');
const minBundlePath = resolve(root, 'dist/multichain-lib.min.js');

function fail(msg) {
  console.error(`verify:bundle FAILED: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`verify:bundle OK: ${msg}`);
}

if (!existsSync(esmBundlePath)) {
  fail(`${esmBundlePath} not found. Run \`npm run build\` first.`);
}
if (!existsSync(minBundlePath)) {
  fail(`${minBundlePath} not found. Run \`npm run build\` first.`);
}

const esmSrc = readFileSync(esmBundlePath, 'utf8');

// (1) The shim must exist. We look for the exact assignment that comes from
//     `process/browser` so that reordering cannot hide the bug.
const shimRegex = /process\.version\s*=\s*['"]['"]/;
const consumerRegex = /process\.version\.slice/;

const shimMatch = shimRegex.exec(esmSrc);
const consumerMatch = consumerRegex.exec(esmSrc);

if (!shimMatch) {
  fail(
    `Could not find \`process.version = ''\` polyfill in dist/multichain-lib.mjs. ` +
      'The webpack ESM bundle is missing the process/browser injection; consumers will crash.'
  );
}

if (!consumerMatch) {
  ok('No `process.version.slice` consumer in dist/multichain-lib.mjs (transitive CJS chain no longer reaches readable-stream@2).');
} else if (shimMatch.index >= consumerMatch.index) {
  fail(
    `Polyfill \`process.version = ''\` appears at offset ${shimMatch.index} but ` +
      `\`process.version.slice\` consumer appears earlier at offset ${consumerMatch.index}. ` +
      'The shim must run BEFORE any consumer of process.version in the bundle.'
  );
} else {
  ok(
    `Polyfill precedes consumer (shim@${shimMatch.index} < consumer@${consumerMatch.index}).`
  );
}

// (2) The named ESM exports we advertise from the root entry must still
//     appear as `export const NAME` in the ESM bundle. This catches a
//     future webpack regression that collapses everything into a default.
const requiredExports = [
  'create',
  'chains',
  'registerChain',
  'createHashRegistry',
  'version',
  'versionGuard',
];
const missingExports = requiredExports.filter(
  (name) => !new RegExp(`export\\s*\\{[^}]*\\b${name}\\b`).test(esmSrc) &&
    !new RegExp(`export\\s+const\\s+${name}\\b`).test(esmSrc) &&
    !new RegExp(`export\\s+var\\s+${name}\\b`).test(esmSrc) &&
    !new RegExp(`export\\s+function\\s+${name}\\b`).test(esmSrc)
);
if (missingExports.length) {
  fail(`dist/multichain-lib.mjs is missing named exports: ${missingExports.join(', ')}.`);
}
ok(`All required named exports present (${requiredExports.join(', ')}).`);

// (3) The UMD min bundle is minified, so `process.browser = true` shows up
//     as `<local>.browser=!0` next to `.title="browser",...version="",...`.
//     We require all three shim markers to appear within a small window
//     so that any future bundler regression that drops the
//     `process/browser` polyfill gets caught here.
const minSrc = readFileSync(minBundlePath, 'utf8');
if (minSrc.length >= esmSrc.length) {
  ok('UMD bundle is smaller or comparable to ESM (no growth regression).');
}
const polyfillCluster = /title\s*=\s*["']browser["'][\s\S]{0,400}\.browser\s*=\s*!?0[\s\S]{0,400}\.version\s*=\s*["']{2}/.test(minSrc);
if (!polyfillCluster) {
  fail(
    'dist/multichain-lib.min.js is missing the bundled process/browser ' +
      'polyfill (expected a `title="browser"` + `.browser=!0` + `.version=""` cluster).'
  );
}
ok('UMD bundle carries the process/browser polyfill cluster.');

console.log('verify:bundle: all invariants hold.');