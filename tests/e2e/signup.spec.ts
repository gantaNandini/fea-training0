import { expect, test } from '@playwright/test'

/**
 * Signup flow e2e: verifies that after submitting the registration form
 * the UI transitions to the "Verify your email" step (the 6-digit code entry).
 * We do not attempt to actually read or enter the code — that requires a live
 * SMTP server and is out of scope for this test.
 */
test('signup form shows the Verify your email step after submission', async ({ page }) => {
  const email = `e2e-signup-${Date.now()}@example.test`
  const password = 'E2e-Signup-1'

  await page.goto('/signup')

  // Fill in the registration details
  await page.getByLabel('Full name').fill('Signup Test User')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(password)

  await page.getByRole('button', { name: 'Create account' }).click()

  // The form should transition to the code-entry step showing the verify heading
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible({ timeout: 15_000 })

  // The email address should be shown in the confirmation copy
  await expect(page.getByText(email, { exact: false })).toBeVisible()

  // The verify-email form should be present (data-testid added in SignupForm)
  await expect(page.getByTestId('verify-email-form')).toBeVisible()
})
