import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.e2e.spec.mjs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Two web servers: one for the in-tree UMD bundle test (port 8080)
  // and one for the Vite fixture (port 5173). The fixture imports the
  // package through its public name, so it only passes if
  // `package.json` correctly steers Vite to `dist/multichain-lib.mjs`.
  //
  // The fixture webServer runs `scripts/start-vite-fixture.sh`, which
  // installs the fixture deps, builds it if needed, and starts
  // `vite preview`. This keeps the test self-bootstrapping in CI
  // where `npm ci` only resolves the parent package's dependencies.
  webServer: [
    {
      command: 'npx http-server . -p 8080',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'bash scripts/start-vite-fixture.sh',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 240000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
