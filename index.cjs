// CommonJS entry point. Used by Node's CJS loader (`require()`) and by
// bundlers that target CJS. Resolved via `"main"` / `"exports.require"`
// in package.json.
//
// The actual implementation lives in `./lib/_create.js` so that the ESM
// entry (`index.mjs`) and this shim share a single source of truth.

'use strict';

const _create = require('./lib/_create.js');

const pkg = require('./package.json');

const lib = {
  version: _create.version,
  versionGuard: _create.versionGuard,
  create: _create.create,
  chains: _create.chains,
  registerChain: _create.registerChain,
  createHashRegistry: _create.createHashRegistry,
};

// Named-export style for CJS consumers:
//   const { create, chains } = require('@maximus-chain/multichain-lib');
module.exports = lib;
module.exports.create = _create.create;
module.exports.chains = _create.chains;
module.exports.registerChain = _create.registerChain;
module.exports.createHashRegistry = _create.createHashRegistry;
module.exports.version = _create.version;
module.exports.versionGuard = _create.versionGuard;
module.exports.default = lib;