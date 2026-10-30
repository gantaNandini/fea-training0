import { Award, Clock, Laptop, ShieldCheck, Users, Wrench } from 'lucide-react'
import { SectionHeader } from '@/components/shared/SectionHeader'

const ITEMS = [
  { Icon: Users, title: 'Taught by practitioners', body: 'Learn from engineers who apply these methods on live industrial projects.' },
  { Icon: Wrench, title: 'Hands-on, tool-first', body: 'Follow along in ANSYS with complete, reproducible models for every topic.' },
  { Icon: Clock, title: 'Lifetime access', body: 'Pay once and keep the course. Return to any lesson whenever a project needs it.' },
  { Icon: Laptop, title: 'Any device, any time', body: 'Resume exactly where you stopped, on desktop, tablet or phone.' },
  { Icon: ShieldCheck, title: 'Secure checkout', body: 'Payments are processed by a trusted gateway. We never see your card details.' },
  { Icon: Award, title: 'Code-aligned content', body: 'Courses follow the structure of the codes engineers are asked to apply.' },
]

export function WhyChoose() {
  return (
    <section className="section-y bg-surface-alt" aria-labelledby="why-heading">
      <div className="container-page">
        <SectionHeader id="why-heading" title="Why engineers choose PYTHAGORAS" subtitle="Practical training built for working professionals" />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ Icon, title, body }) => (
            <li key={title} className="card-lift flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-plum-50 text-plum-700 dark:bg-plum-900 dark:text-plum-200">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
