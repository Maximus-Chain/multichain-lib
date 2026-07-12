#!/usr/bin/env bash
# Bootstraps the examples/web/vite fixture and starts `vite preview`.
#
# Why this exists: the fixture is shipped inside the npm package
# (`files: ["examples"]`) without its own `node_modules/`. In CI,
# `npm ci` only installs the parent package's dependencies, so when
# Playwright tries to spawn `npm run --prefix examples/web/vite preview`
# the `vite` binary isn't on PATH and the webServer silently dies,
# producing the misleading
#
#   Error: Timed out waiting 180000ms from config.webServer
#
# To avoid making CI manually orchestrate the fixture, this script:
#   1. Installs the fixture deps (idempotent: skipped if vite already
#      resolves).
#   2. Builds the fixture (idempotent: skipped if dist/ is fresh).
#   3. Starts `vite preview`.
#
# Local usage: `npm run --prefix examples/web/vite preview` still works
# for manual poking; this script is only invoked by Playwright.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURE="${ROOT}/examples/web/vite"

cd "${FIXTURE}"

if [ ! -x "${FIXTURE}/node_modules/.bin/vite" ]; then
  echo "[start-vite-fixture] installing fixture dependencies..."
  npm install --no-audit --no-fund --ignore-scripts --loglevel=error
fi

if [ ! -f "${FIXTURE}/dist/index.html" ] || [ "${FIXTURE}/src" -nt "${FIXTURE}/dist/index.html" ]; then
  echo "[start-vite-fixture] building fixture bundle..."
  npm run build --silent
fi

echo "[start-vite-fixture] starting vite preview on :5173..."
exec npx vite preview --port 5173 --strictPort --host 127.0.0.1