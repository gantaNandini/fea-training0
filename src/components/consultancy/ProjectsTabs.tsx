import Link from 'next/link'
import { EmptyState } from '@/components/shared/EmptyState'
import { ButtonLink } from '@/components/ui/button'
import { ProjectCard } from './ProjectCard'
import type { ProjectDTO } from '@/lib/data/events'
import { cn } from '@/lib/utils/cn'

/** Projects grouped into tabs by category (server-rendered; the active tab is the `category` query value). */
export function ProjectsTabs({ projects, active }: { projects: ProjectDTO[]; active?: string }) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="Project case studies are being added"
        body="Talk to us about your simulation, design-verification or failure-investigation needs."
        action={<ButtonLink href="/contact">Discuss your project</ButtonLink>}
      />
    )
  }
  const categories = Array.from(new Set(projects.map((p) => p.category)))
  const current = active && categories.includes(active) ? active : 'All'
  const shown = current === 'All' ? projects : projects.filter((p) => p.category === current)
  const tabs = ['All', ...categories]
  return (
    <div className="space-y-8">
      <nav aria-label="Project categories" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={t === 'All' ? '/consultancy?tab=projects' : `/consultancy?tab=projects&category=${encodeURIComponent(t)}`}
            scroll={false}
            aria-current={t === current ? 'page' : undefined}
            className={cn('inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold', t === current ? 'border-plum-700 bg-plum-700 text-white' : 'border-border hover:bg-muted')}
          >
            {t}
          </Link>
        ))}
      </nav>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{shown.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
    </div>
  )
}
