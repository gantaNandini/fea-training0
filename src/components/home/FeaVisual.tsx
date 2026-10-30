/**
 * Illustrative FEA result: a plate with a hole under tension, drawn as a coloured quad mesh.
 * Pure SVG generated at render time; no image files needed. Labelled "illustrative" on purpose.
 */
import { useId } from 'react'

const RAMP = ['#1E3A8A', '#2563EB', '#06B6D4', '#10B981', '#FACC15', '#F97316', '#DC2626']

function cells(cols: number, rows: number) {
  const cx = cols / 2
  const cy = rows / 2
  const r0 = 2.7
  const out: { x: number; y: number; c: string }[] = []
  let max = 0
  const raw: { x: number; y: number; v: number }[] = []
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const dx = i + 0.5 - cx
      const dy = j + 0.5 - cy
      const r = Math.hypot(dx, dy)
      if (r < r0) continue
      const s = dy / r // sin of angle from the load axis (x)
      const v = (r0 / r) ** 2 * (0.45 + 1.1 * s * s) + 0.12
      max = Math.max(max, v)
      raw.push({ x: i, y: j, v })
    }
  }
  for (const c of raw) {
    const t = Math.min(0.999, c.v / max)
    out.push({ x: c.x, y: c.y, c: RAMP[Math.floor(t * RAMP.length)] })
  }
  return out
}

export function FeaVisual({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const clip = `fea-clip-${uid}`
  const legend = `fea-legend-${uid}`
  const cols = 22
  const rows = 14
  const w = 20
  const list = cells(cols, rows)
  const W = cols * w
  const H = rows * w
  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${W} ${H + 34}`}
        role="img"
        aria-label="Illustrative finite element stress contour of a plate with a hole"
        className="h-auto w-full drop-shadow-2xl"
      >
        <defs>
          <clipPath id={clip}><rect width={W} height={H} rx="14" /></clipPath>
          <linearGradient id={legend} x1="0" x2="1">
            {RAMP.map((c, i) => <stop key={c} offset={i / (RAMP.length - 1)} stopColor={c} />)}
          </linearGradient>
        </defs>
        <g clipPath={`url(#${clip})`}>
          <rect width={W} height={H} fill="#071B3F" />
          {list.map((c) => (
            <rect key={`${c.x}-${c.y}`} x={c.x * w} y={c.y * w} width={w} height={w} fill={c.c} stroke="#FFFFFF" strokeOpacity="0.18" />
          ))}
          <circle cx={W / 2} cy={H / 2} r={2.7 * w} fill="#071B3F" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="2" />
        </g>
        <rect x="0" y={H + 14} width={W} height="8" rx="4" fill={`url(#${legend})`} />
        <text x="0" y={H + 32} fontSize="11" fill="currentColor" opacity="0.8" fontFamily="Arial, sans-serif">Low</text>
        <text x={W} y={H + 32} fontSize="11" textAnchor="end" fill="currentColor" opacity="0.8" fontFamily="Arial, sans-serif">High stress</text>
        <text x={W / 2} y={H + 32} fontSize="11" textAnchor="middle" fill="currentColor" opacity="0.8" fontFamily="Arial, sans-serif">Illustrative result</text>
      </svg>
    </figure>
  )
}
