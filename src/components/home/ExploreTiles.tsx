import Link from 'next/link'
import { ArrowRight, Award, Building2, CalendarDays, FileText, Rocket, Wrench } from 'lucide-react'

const TILES = [
  { href: '/upcoming-courses', Icon: Rocket, title: 'Upcoming courses', body: 'New courses and the next batches.' },
  { href: '/events', Icon: CalendarDays, title: 'Events', body: 'Conferences, workshops and webinars.' },
  { href: '/fees', Icon: FileText, title: 'Fees & syllabus', body: 'Duration, fees and syllabus PDFs.' },
  { href: '/corporate-training', Icon: Building2, title: 'Corporate training', body: 'Training programmes for engineering teams.' },
  { href: '/consultancy', Icon: Wrench, title: 'Consultancy', body: 'FEA and fitness-for-service projects.' },
  { href: '/fees#certificate', Icon: Award, title: 'Certificates', body: 'Earn a verifiable certificate.' },
]

/** Home page: one clean row of doors into the rest of the site. */
export function ExploreTiles() {
  return (
    <section className="section-y bg-surface-alt" aria-labelledby="explore-heading">
      <div className="container-page">
        <h2 id="explore-heading" className="mb-8">Explore</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map(({ href, Icon, title, body }) => (
            <li key={href} className="reveal">
              <Link href={href} className="card-lift group flex h-full items-center gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-plum-50 text-plum-700 dark:bg-plum-900/40 dark:text-plum-300">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-bold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{body}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
