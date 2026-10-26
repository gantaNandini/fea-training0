'use client'

import * as React from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export interface StatItem {
  label: string
  value: number
  suffix?: string
}

function CountUp({ value, suffix, animate }: { value: number; suffix?: string; animate: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [shown, setShown] = React.useState(animate ? 0 : value)

  React.useEffect(() => {
    if (!animate) {
      setShown(value)
      return
    }
    const el = ref.current
    if (!el) return
    let raf = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const dur = 1400
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur)
          setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [animate, value])

  return (
    <span ref={ref}>
      {shown.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

/** REQ-070: count-up on scroll; reduced motion shows final values immediately. */
export function StatsSection({ title, stats }: { title: string; stats: StatItem[] }) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  return (
    <section className="section-y" aria-labelledby="stats-heading">
      <div className="container-page">
        <h2 id="stats-heading" className="mb-8 text-center">
          {title}
        </h2>
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-6 text-center">
              <dd className="font-display text-4xl font-extrabold text-plum-700 dark:text-plum-300">
                <CountUp value={s.value} suffix={s.suffix} animate={!reduced} />
              </dd>
              <dt className="mt-2 text-sm text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
