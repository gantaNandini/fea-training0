import { expect, test } from '@playwright/test'
import { signUpAndLogin } from './helpers'

// Needs: database seeded (`pnpm db:seed`), PAYMENT_PROVIDER=mock, `pnpm dev` (started by Playwright).

test('1. home shows hero, >= 6 course cards and the footer', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('hero')).toBeVisible()
  expect(await page.getByTestId('course-card').count()).toBeGreaterThanOrEqual(6)
  await expect(page.locator('footer')).toBeVisible()
})

test('2. catalogue filters by category (courses 3 and 11)', async ({ page }) => {
  await page.goto('/courses?category=fracture-mechanics')
  await expect(page.getByTestId('course-card').filter({ hasText: '3D Fracture Mechanics Simulation' })).toBeVisible()
  await expect(page.getByTestId('course-card').filter({ hasText: 'Fatigue and Fracture Mechanics' })).toBeVisible()
})

test('3. course detail, and the upcoming course shows "Curriculum coming soon"', async ({ page }) => {
  await page.goto('/courses/fatigue-ratchetting-creep-assessment')
  await expect(page.getByTestId('course-title')).toBeVisible()
  await expect(page.getByTestId('curriculum')).toBeVisible()
  await expect(page.getByTestId('purchase-card')).toBeVisible()

  await page.goto('/courses/offshore-wind-turbine-structures-welded-joint-fatigue-dnv')
  await expect(page.getByText('Coming soon').first()).toBeVisible()
  await expect(page.getByText('Curriculum coming soon').first()).toBeVisible()
})

test('4-6. cart badge, mock checkout, My courses, and player guard', async ({ page }) => {
  await signUpAndLogin(page)

  // 4. add to cart -> badge = 1
  await page.goto('/courses/basic-fea-training-for-beginners')
  await page.getByTestId('add-to-cart').first().click()
  await expect(page.getByTestId('cart-count').first()).toHaveText('1')

  // 5. mock checkout
  await page.goto('/checkout')
  await page.getByTestId('pay-now').click()
  await page.waitForURL(/\/checkout\/success/, { timeout: 30_000 })
  await expect(page.getByTestId('order-confirmed')).toBeVisible({ timeout: 30_000 })

  // 6. enrolled course appears
  await page.goto('/my-courses')
  await expect(page.getByTestId('my-course').filter({ hasText: 'Basic FEA Training for Beginners' })).toBeVisible()
})

test('7. a non-enrolled user is redirected from the player to the course page', async ({ page }) => {
  await signUpAndLogin(page)
  await page.goto('/courses/fatigue-ratchetting-creep-assessment')
  // find any lesson id through the DB-independent route: /learn/{slug} redirects when not enrolled
  await page.goto('/learn/fatigue-ratchetting-creep-assessment')
  await expect(page).toHaveURL(/\/courses\/fatigue-ratchetting-creep-assessment/)
})
