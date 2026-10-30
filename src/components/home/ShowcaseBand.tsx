import { CheckCircle2 } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { FeaVisual } from './FeaVisual'

const POINTS = [
  'Real ANSYS models, built from scratch on screen',
  'ASME, API and DNV methods explained with worked examples',
  'Taught by practising engineers with industry experience',
  'Lifetime access: revisit any lesson on your next project',
]

/** Dark split band: pitch on the left, an illustrative FEA contour on the right. */
export function ShowcaseBand() {
  return (
    <section className="relative overflow-hidden bg-plum-900 text-white" aria-labelledby="showcase-heading">
      <div className="gradient-brand absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="container-page section-y relative grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-coral-400">Learn by doing</p>
          <h2 id="showcase-heading" className="mt-2 text-white">Engineering training that looks like real project work</h2>
          <p className="mt-4 text-white/90">
            Every course is built around complete analysis models, so what you learn here is what you will do at your desk on Monday.
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-coral-400" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <ButtonLink href="/courses" size="lg" className="ring-2 ring-white/70">Explore all courses</ButtonLink>
          </div>
        </div>
        <FeaVisual className="text-white" />
      </div>
    </section>
  )
}
