// Legacy CJS entry. Kept so that `require('..')` style imports (used
// in tests under test/) continue to resolve. The real entry is now
// `index.cjs` / `index.mjs`; this file just re-exports it.

module.exports = require('./index.cjs');
