import { BadgeCheck, CreditCard, Search, Unlock } from 'lucide-react'
import { SectionHeader } from '@/components/shared/SectionHeader'

const STEPS = [
  { Icon: Search, title: 'Choose a course', body: 'Browse by topic, compare courses and read the full outline before you buy.' },
  { Icon: CreditCard, title: 'Pay securely', body: 'Check out with UPI, cards or net banking through our secure payment gateway.' },
  { Icon: Unlock, title: 'Instant access', body: 'The moment payment succeeds you are enrolled automatically. No waiting for approval.' },
  { Icon: BadgeCheck, title: 'Learn at your pace', body: 'Watch lessons on any device, track your progress and come back any time, for life.' },
]

/** Explains the purchase flow; step 3 states the automatic enrolment promise. */
export function HowItWorks() {
  return (
    <section className="section-y" aria-labelledby="how-heading">
      <div className="container-page">
        <SectionHeader id="how-heading" title="From payment to learning in seconds" subtitle="Four simple steps, fully automatic" />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="card-lift relative rounded-2xl border border-border bg-card p-6">
              <span className="absolute -top-3 left-6 rounded-full bg-plum-700 px-3 py-0.5 text-xs font-bold text-white">Step {i + 1}</span>
              <span className="gradient-brand flex h-12 w-12 items-center justify-center rounded-xl text-white">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
