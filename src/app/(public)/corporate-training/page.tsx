import type { Metadata } from 'next'
import { Building2, ClipboardList, Users } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import { ClientLogos } from '@/components/home/ClientLogos'
import { ButtonLink } from '@/components/ui/button'
import { buildMetadata } from '@/lib/utils/seo'

export const revalidate = 600
export const metadata: Metadata = buildMetadata({
  title: 'Corporate training',
  description: 'On-site and online training programmes for engineering teams.',
  path: '/corporate-training',
})

const POINTS = [
  { Icon: Users, title: 'Trained for your team', body: 'Group sessions for your engineers, online or at your site.' },
  { Icon: ClipboardList, title: 'Tailored syllabus', body: 'We adapt topics, depth and examples to the codes and software your team uses.' },
  { Icon: Building2, title: 'Industry focused', body: 'Pressure vessels, piping, rotating equipment and structural integrity.' },
]

export default function CorporateTrainingPage() {
  return (
    <>
      <PageHero title="Corporate training" subtitle="Practical FEA and fitness-for-service training for engineering teams." crumb="Corporate training" />
      <section className="container-page py-10 md:py-14" aria-label="What we offer">
        <div className="grid gap-6 md:grid-cols-3">
          {POINTS.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-plum-50 text-plum-700 dark:bg-plum-900/40 dark:text-plum-300">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg">{title}</h2>
              <p className="mt-2 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4 rounded-xl bg-surface-alt p-6">
          <p className="max-w-xl">Planning training for your company? Tell us the number of participants, topics and preferred dates.</p>
          <ButtonLink href="/contact">Request a proposal</ButtonLink>
        </div>
      </section>
      <ClientLogos />
    </>
  )
}
