const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Dependency-free SVG line chart (values in paise). Accessible: has a title and a data table fallback. */
export function RevenueChart({ values, year }: { values: number[]; year: number }) {
  const W = 900
  const H = 320
  const padL = 56
  const padR = 20
  const padT = 20
  const padB = 36
  const max = Math.max(...values, 1)
  const niceMax = Math.pow(10, Math.ceil(Math.log10(max))) / (max / Math.pow(10, Math.floor(Math.log10(max))) > 5 ? 1 : 2)
  const top = Math.max(niceMax, max)
  const x = (i: number) => padL + (i * (W - padL - padR)) / 11
  const y = (v: number) => padT + (1 - v / top) * (H - padT - padB)
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top)
  const fmt = (p: number) => `₹${(p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="rev-title" className="h-auto w-full">
        <title id="rev-title">{`Revenue by month for ${year}`}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#E5E7EB" />
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6B7280">{fmt(t)}</text>
          </g>
        ))}
        {MONTHS.map((m, i) => (
          <g key={m}>
            <line x1={x(i)} x2={x(i)} y1={padT} y2={H - padB} stroke="#F3F4F6" />
            <text x={x(i)} y={H - 12} textAnchor="middle" fontSize="11" fill="#6B7280">{m.slice(0, 3)}</text>
          </g>
        ))}
        <polyline points={pts} fill="none" stroke="#6C7AE0" strokeWidth="3" strokeLinejoin="round" />
        {values.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="4.5" fill="#fff" stroke="#6C7AE0" strokeWidth="2.5">
            <title>{`${MONTHS[i]} ${year}: ${fmt(v)}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="sr-only">
        {values.map((v, i) => `${MONTHS[i]}: ${fmt(v)}`).join('; ')}
      </figcaption>
    </figure>
  )
}
