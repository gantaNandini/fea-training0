import Link from 'next/link'
import { ArrowRight, Wrench } from 'lucide-react'
import { getSettings } from '@/lib/data/settings'

const DEFAULT_POINTS = [
  'Finite element analysis (FEA) and ANSYS simulation',
  'ASME pressure vessel and piping design review',
  'Fatigue, fracture and structural integrity assessment',
  'Rotordynamics and vibration studies',
]

/** Home page: engineering consultancy (replaces the separate consultancy website). Fully editable in Admin → Settings → Website. */
export async function ConsultancySection({ force, hideHeading }: { force?: boolean; hideHeading?: boolean } = {}) {
  const s = await getSettings()
  if (!force && s.consultancy_enabled === 'false') return null
  const title = s.consultancy_title || 'Engineering consultancy'
  const body =
    s.consultancy_body ||
    'Beyond training, our engineers take on real analysis and design projects. Talk to us about your simulation, design-verification or failure-investigation needs.'
  const points = (s.consultancy_points ? s.consultancy_points.split('\n') : DEFAULT_POINTS).map((x) => x.trim()).filter(Boolean)
  const ctaLabel = s.consultancy_cta_label || 'Discuss your project'
  const ctaHref = s.consultancy_cta_href || '/contact'

  return (
    <section id="consultancy" className="section-y bg-surface-alt" aria-labelledby="consultancy-heading">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {hideHeading ? <h2 id="consultancy-heading" className="sr-only">{title}</h2> : <h2 id="consultancy-heading">{title}</h2>}
          <p className="mt-3 max-w-2xl text-muted-foreground">{body}</p>
          <Link
            href={ctaHref}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md px-5 font-semibold text-white gradient-brand hover:brightness-110"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="space-y-3 rounded-xl border border-border bg-card p-6">
          {points.map((p) => (
            <li key={p} className="flex gap-3">
              <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-plum-700 dark:text-plum-300" aria-hidden="true" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
