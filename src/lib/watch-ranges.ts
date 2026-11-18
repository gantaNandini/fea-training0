/** Watched-seconds bookkeeping. Ranges are [startSec, endSec) in whole seconds. */
export type Range = [number, number]

export function normalizeRanges(input: unknown, duration: number): Range[] {
  if (!Array.isArray(input)) return []
  const out: Range[] = []
  for (const r of input) {
    if (!Array.isArray(r) || r.length !== 2) continue
    const a = Math.max(0, Math.floor(Number(r[0])))
    const b = Math.min(Math.ceil(duration), Math.ceil(Number(r[1])))
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) out.push([a, b])
  }
  return mergeRanges(out, [])
}

export function mergeRanges(a: Range[], b: Range[]): Range[] {
  const all = [...a, ...b].sort((x, y) => x[0] - y[0])
  const out: Range[] = []
  for (const [s, e] of all) {
    const last = out[out.length - 1]
    if (last && s <= last[1]) last[1] = Math.max(last[1], e)
    else out.push([s, e])
  }
  return out
}

export function coveredSeconds(ranges: Range[]): number {
  return ranges.reduce((n, [s, e]) => n + (e - s), 0)
}

export function coverage(ranges: Range[], duration: number): number {
  return duration > 0 ? Math.min(1, coveredSeconds(ranges) / duration) : 0
}
