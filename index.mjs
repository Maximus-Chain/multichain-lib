// ESM entry point. Bundlers (webpack, rollup, vite) and Node's ESM
// loader resolve this file via the `"module"` / `"exports.import"` keys
// in package.json.
//
// Re-exports the v3 root API (`create`, `chains`, `registerChain`,
// `createHashRegistry`, `version`) as named exports. The full multi-chain
// factory lives in `./lib/_create.js` (kept as CommonJS so that lazy
// `require()`s inside it stay synchronous and tree-shake-friendly).

import internal from './lib/_create.js';

const { create, chains, registerChain, createHashRegistry, version, versionGuard } = internal;

export { create, chains, registerChain, createHashRegistry, version, versionGuard };

// Default export — the whole root namespace. Lets
// `import multichain from '@maximus-chain/multichain-lib'` keep working.
export default internal;