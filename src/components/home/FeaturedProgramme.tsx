import { ArrowRight, Clock, ListChecks } from 'lucide-react'
import { getPage } from '@/lib/data/pages'
import { sanitizeRichText } from '@/lib/utils/sanitize'
import { ButtonLink } from '@/components/ui/button'

/** Home-page feature for the programme edited under Admin → Settings → pages ("featured-programme"). */
export async function FeaturedProgramme() {
  const page = await getPage('featured-programme')
  if (!page) return null
  return (
    <section className="section-y bg-surface-alt" aria-labelledby="programme-heading">
      <div className="container-page grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-plum-700">Featured programme</p>
          <h2 id="programme-heading" className="mt-2">{page.title}</h2>
          <p className="mt-3 text-muted-foreground">ASME Section VIII Division 2 – Part 5</p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-plum-700" aria-hidden="true" />24 sessions, 45 minutes each</li>
            <li className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-plum-700" aria-hidden="true" />Practical + code-oriented, 8 modules</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/featured-programme" size="lg">
              View full syllabus <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="outline">Enquire now</ButtonLink>
          </div>
        </div>
        <div className="relative max-h-[28rem] overflow-hidden rounded-2xl border border-border bg-card p-6">
          <div className="prose-content" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.body) }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" aria-hidden="true" />
        </div>
      </div>
    </section>
  )
}
