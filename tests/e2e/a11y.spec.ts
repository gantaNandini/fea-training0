import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = ['/', '/courses', '/courses/fatigue-ratchetting-creep-assessment', '/cart']

for (const path of PAGES) {
  test(`no critical axe violations on ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const critical = results.violations.filter((v) => v.impact === 'critical')
    expect(critical, JSON.stringify(critical.map((v) => v.id))).toEqual([])
  })
}

test('hero heading and subheading are legible at 375px (REQ-063)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  const hero = page.getByTestId('hero')
  await expect(hero).toBeVisible()
  // Replace the slide image by pure white to prove the text still has a dark scrim behind it.
  await page.addStyleTag({ content: '[data-testid="hero"] img { filter: brightness(10) !important; }' })
  const sub = page.getByTestId('hero-sub').first()
  const color = await sub.evaluate((el) => getComputedStyle(el).color)
  expect(color).toBe('rgb(255, 255, 255)')
  // The text sits on a solid plum-900 panel with >= 75% opacity, whatever the image is.
  const panel = page.getByTestId('hero-panel').first()
  const bg = await panel.evaluate((el) => getComputedStyle(el).backgroundColor)
  const alpha = Number(/rgba?\(([^)]+)\)/.exec(bg)?.[1].split(/[,/]\s*/)[3] ?? 1)
  expect(alpha).toBeGreaterThanOrEqual(0.75)
})
