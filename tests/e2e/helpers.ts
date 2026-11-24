import { execSync } from 'node:child_process'
import path from 'node:path'
import { expect, type Page } from '@playwright/test'

const root = path.resolve(__dirname, '../..')

/**
 * Creates a verified STUDENT directly in the database (bcrypt hash, emailVerified set),
 * then logs in through the normal /login page.
 *
 * Bypasses the email-code flow so e2e tests that need an authenticated session
 * do not require a live SMTP server.
 */
export async function signUpAndLogin(page: Page) {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`
  const password = 'E2e-Password-1'

  execSync(
    `pnpm tsx tests/e2e/create-e2e-user.ts ${email} ${password}`,
    { cwd: root, env: { ...process.env }, stdio: 'pipe' },
  )

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByTestId('account-menu')).toBeVisible({ timeout: 20_000 })
  return { email, password }
}
