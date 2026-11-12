import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import type { ProjectDTO } from '@/lib/data/events'

export function ProjectCard({ p }: { p: ProjectDTO }) {
  const paragraphs = (p.description ?? '').split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card" data-testid="project-card">
      <div className="relative aspect-[16/9] bg-muted">
        <PlaceholderArt src={p.image} alt={p.title} fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-plum-700 px-3 py-1 text-xs font-semibold text-white">{p.category}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-bold leading-snug">{p.title}</h3>
        {p.client || p.year ? <p className="text-xs text-muted-foreground">{[p.client, p.year].filter(Boolean).join(' · ')}</p> : null}
        <p className="text-sm">{p.summary}</p>
        {paragraphs.length > 0 ? (
          <details className="mt-auto pt-2 text-sm">
            <summary className="min-h-11 cursor-pointer font-semibold text-link">Read more</summary>
            <div className="mt-2 space-y-2 text-muted-foreground">{paragraphs.map((t, i) => <p key={i}>{t}</p>)}</div>
          </details>
        ) : null}
      </div>
    </article>
  )
}
