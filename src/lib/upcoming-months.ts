/** Month tabs for the Upcoming courses page (January-December) plus the "In progress" bucket. */
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export const IN_PROGRESS = 'in-progress'

export interface HasMonth { upcomingMonth: number | null }

/** Courses whose month is set, grouped 1..12; everything else goes to `inProgress`. */
export function groupByMonth<T extends HasMonth>(courses: T[]): { byMonth: T[][]; inProgress: T[] } {
  const byMonth: T[][] = Array.from({ length: 12 }, () => [])
  const inProgress: T[] = []
  for (const c of courses) {
    const m = c.upcomingMonth
    if (m != null && Number.isInteger(m) && m >= 1 && m <= 12) byMonth[m - 1]!.push(c)
    else inProgress.push(c)
  }
  return { byMonth, inProgress }
}

/**
 * Which tab is open. A valid `?month=` wins ("1".."12" or "in-progress"). Otherwise the first month
 * that has a course, then "In progress" if it has any, otherwise the current month.
 */
export function pickActiveTab(requested: string | undefined, counts: { byMonth: number[]; inProgress: number }, now = new Date()): string {
  if (requested === IN_PROGRESS) return IN_PROGRESS
  const n = Number(requested)
  if (requested && Number.isInteger(n) && n >= 1 && n <= 12) return String(n)
  const firstWithCourse = counts.byMonth.findIndex((c) => c > 0)
  if (firstWithCourse >= 0) return String(firstWithCourse + 1)
  if (counts.inProgress > 0) return IN_PROGRESS
  return String(now.getMonth() + 1)
}
