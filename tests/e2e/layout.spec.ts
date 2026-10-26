import { expect, test } from '@playwright/test'

const WIDTHS = [375, 768, 1024, 1440]
const PATHS = ['/', '/courses']

for (const width of WIDTHS) {
  for (const path of PATHS) {
    test(`no horizontal scroll, equal card heights, no overflow — ${path} @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const noScroll = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
      expect(noScroll).toBe(true)

      const cards = page.getByTestId('course-card')
      const n = await cards.count()
      const boxes = []
      for (let i = 0; i < n; i++) boxes.push(await cards.nth(i).boundingBox())
      const rows = new Map<number, number[]>()
      for (const b of boxes) if (b) rows.set(Math.round(b.y), [...(rows.get(Math.round(b.y)) ?? []), Math.round(b.height)])
      for (const heights of rows.values()) expect(new Set(heights).size).toBe(1)

      const overflowing = await page.evaluate(() => {
        const bad: string[] = []
        document.querySelectorAll<HTMLElement>('[data-testid="course-card"]').forEach((card) => {
          const c = card.getBoundingClientRect()
          card.querySelectorAll<HTMLElement>('*').forEach((el) => {
            const r = el.getBoundingClientRect()
            if (r.width > 0 && (r.right > c.right + 1 || r.left < c.left - 1)) bad.push(el.tagName)
          })
        })
        return bad
      })
      expect(overflowing).toEqual([])
    })
  }
}

// Screenshot baselines: generate with the Playwright Docker image (see README) and commit them.
test('home above-the-fold screenshot @ 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveScreenshot('home-1440.png', { maxDiffPixelRatio: 0.02, animations: 'disabled' })
})
