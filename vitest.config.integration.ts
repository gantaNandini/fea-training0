import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'

loadEnv()

const testUrl =
  process.env.DATABASE_URL_TEST ??
  'postgresql://pythagoras:pythagoras@localhost:5433/pythagoras_test?schema=public'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    // DB-backed tests share one database: run files one after another.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      DATABASE_URL: testUrl,
      DATABASE_URL_TEST: testUrl,
      PAYMENT_PROVIDER: 'mock',
      NEXTAUTH_SECRET: 'integration-test-secret',
      RAZORPAY_WEBHOOK_SECRET: 'whsec_integration',
      RAZORPAY_KEY_SECRET: 'key_secret_integration',
      CRON_SECRET: 'cron_integration',
    },
  },
})
