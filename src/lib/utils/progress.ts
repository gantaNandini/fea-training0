/** Completion percentage, rounded, clamped 0-100. 0 lessons -> 0. */
export function computeProgress(completed: number, total: number): number {
  if (total <= 0 || completed <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((completed / total) * 100)))
}
