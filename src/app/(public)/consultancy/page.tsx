import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultancySection } from '@/components/home/ConsultancySection'
import { ProjectsTabs } from '@/components/consultancy/ProjectsTabs'
import { getConsultancyProjects } from '@/lib/data/events'
import { buildMetadata } from '@/lib/utils/seo'
import { cn } from '@/lib/utils/cn'

export const revalidate = 600
export const metadata: Metadata = buildMetadata({
  title: 'Engineering consultancy',
  description: 'Finite element analysis, pressure vessel design review, fatigue and fracture assessment, with project case studies.',
  path: '/consultancy',
})

type Props = { searchParams: Promise<{ tab?: string; category?: string }> }

export default async function ConsultancyPage({ searchParams }: Props) {
  const { tab, category } = await searchParams
  const projectsTab = tab === 'projects'
  const projects = projectsTab ? await getConsultancyProjects() : []
  const tabs = [
    { key: 'services', label: 'Services', href: '/consultancy' },
    { key: 'projects', label: 'Projects', href: '/consultancy?tab=projects' },
  ]
  return (
    <>
      <PageHero title="Engineering consultancy" subtitle="Real analysis and design support from the same engineers who teach the courses." crumb="Consultancy" />
      <div className="container-page pt-8">
        <nav aria-label="Consultancy sections" className="flex flex-wrap gap-2 border-b border-border pb-3">
          {tabs.map((t) => {
            const on = (t.key === 'projects') === projectsTab
            return (
              <Link key={t.key} href={t.href} scroll={false} aria-current={on ? 'page' : undefined}
                className={cn('inline-flex min-h-11 items-center rounded-md px-4 font-semibold', on ? 'bg-plum-700 text-white' : 'hover:bg-muted')}>
                {t.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {projectsTab ? (
        <div className="container-page py-10 md:py-14"><ProjectsTabs projects={projects} active={category} /></div>
      ) : (
        <ConsultancySection force hideHeading />
      )}
    </>
  )
}
