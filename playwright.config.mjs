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
  webServer: [
    {
      command: 'npx http-server . -p 8080',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npm run --prefix examples/web/vite preview',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
