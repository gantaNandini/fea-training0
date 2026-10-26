import { expect, type Page } from '@playwright/test'

export async function signUpAndLogin(page: Page) {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`
  const password = 'E2e-Password-1'
  await page.goto('/signup')
  await page.getByLabel('Full name').fill('E2E Student')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('your account has been created', { exact: false })).toBeVisible()
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByTestId('account-menu')).toBeVisible({ timeout: 20_000 })
  return { email, password }
}
