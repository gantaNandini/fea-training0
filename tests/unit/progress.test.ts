import { describe, expect, it } from 'vitest'
import { computeProgress } from '@/lib/utils/progress'

describe('computeProgress', () => {
  it('0/10 -> 0%', () => expect(computeProgress(0, 10)).toBe(0))
  it('5/10 -> 50%', () => expect(computeProgress(5, 10)).toBe(50))
  it('10/10 -> 100%', () => expect(computeProgress(10, 10)).toBe(100))
  it('1/1 -> 100%', () => expect(computeProgress(1, 1)).toBe(100))
  it('0/0 -> 0%', () => expect(computeProgress(0, 0)).toBe(0))
  it('rounds and clamps', () => {
    expect(computeProgress(1, 3)).toBe(33)
    expect(computeProgress(2, 3)).toBe(67)
    expect(computeProgress(12, 10)).toBe(100)
  })
})
