import { defineConfig, devices } from '@playwright/test'

const PORT = 3000

// E2E runs against `pnpm dev` (not a production build) because the mock payment
// provider intentionally throws when NODE_ENV=production.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'a11y', testMatch: /a11y\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'layout', testMatch: /layout\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'smoke', testMatch: /smoke\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { PAYMENT_PROVIDER: 'mock' },
  },
})
