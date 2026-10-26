import { describe, expect, it } from 'vitest'
import { contrastPairs } from '@/lib/design/tokens'
import { contrastRatio } from '@/lib/utils/contrast'

describe('WCAG AA contrast for every design-token pair (REQ-305, REQ-321A)', () => {
  it('sanity: black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1)
  })

  for (const pair of contrastPairs) {
    it(`${pair.name} (${pair.fg} on ${pair.bg}) >= ${pair.min}:1`, () => {
      expect(contrastRatio(pair.fg, pair.bg)).toBeGreaterThanOrEqual(pair.min)
    })
  }
})
