import { describe, expect, it } from 'vitest'
import { IN_PROGRESS, MONTHS, groupByMonth, pickActiveTab } from '@/lib/upcoming-months'

const course = (id: string, upcomingMonth: number | null) => ({ id, upcomingMonth })

describe('upcoming courses: month tabs', () => {
  it('has the twelve months January to December', () => {
    expect(MONTHS).toHaveLength(12)
    expect(MONTHS[0]).toBe('January')
    expect(MONTHS[11]).toBe('December')
  })

  it('puts a course with no month under "In progress" (e.g. Offshore Wind until a month is set)', () => {
    const { byMonth, inProgress } = groupByMonth([course('offshore', null)])
    expect(inProgress.map((c) => c.id)).toEqual(['offshore'])
    expect(byMonth.every((m) => m.length === 0)).toBe(true)
  })

  it('files courses under their month and treats invalid months as "In progress"', () => {
    const { byMonth, inProgress } = groupByMonth([course('a', 1), course('b', 12), course('c', 3), course('d', 3), course('bad0', 0), course('bad13', 13)])
    expect(byMonth[0]!.map((c) => c.id)).toEqual(['a'])
    expect(byMonth[11]!.map((c) => c.id)).toEqual(['b'])
    expect(byMonth[2]!.map((c) => c.id)).toEqual(['c', 'd'])
    expect(inProgress.map((c) => c.id)).toEqual(['bad0', 'bad13'])
  })

  const counts = (byMonth: number[], inProgress = 0) => ({ byMonth: [...byMonth, ...Array(12 - byMonth.length).fill(0)], inProgress })

  it('opens the requested tab when valid', () => {
    expect(pickActiveTab('7', counts([]))).toBe('7')
    expect(pickActiveTab(IN_PROGRESS, counts([]))).toBe(IN_PROGRESS)
  })

  it('ignores a bad ?month= and falls back', () => {
    expect(pickActiveTab('13', counts([0, 0, 2]))).toBe('3')
    expect(pickActiveTab('abc', counts([]), new Date(2026, 10, 22))).toBe('11')
  })

  it('opens the first month with a course, else "In progress", else the current month', () => {
    expect(pickActiveTab(undefined, counts([0, 0, 0, 1]), new Date(2026, 0, 5))).toBe('4')
    expect(pickActiveTab(undefined, counts([], 1), new Date(2026, 0, 5))).toBe(IN_PROGRESS)
    expect(pickActiveTab(undefined, counts([]), new Date(2026, 5, 5))).toBe('6')
  })
})
