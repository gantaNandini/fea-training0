import type { WebinarDTO } from '@/lib/types'
import { CalendarDays } from 'lucide-react'
import { getUpcomingWebinar } from '@/lib/data/content'
import { ButtonLink } from '@/components/ui/button'
import { messages } from '@/lib/messages'

/** REQ-073/074: only when an active webinar is in the future; date as "DD MMM YYYY". */
export async function WebinarBanner({ webinar }: { webinar?: WebinarDTO | null }) {
  const w = webinar !== undefined ? webinar : await getUpcomingWebinar()
  if (!w) return null
  const date = new Date(w.date)
  if (date.getTime() <= Date.now()) return null
  const label = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
  return (
    <section className="container-page py-6" aria-label={messages.home.webinar} data-testid="webinar-banner">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-plum-200 bg-plum-50 p-6 sm:flex-row sm:items-center dark:border-plum-800 dark:bg-plum-900/40">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-plum-700 text-white">
            <CalendarDays className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-plum-700 dark:text-plum-300">
              {messages.home.webinar}
            </p>
            <p className="font-display text-lg font-bold">{w.title}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </div>
        <ButtonLink href={w.link} target="_blank" rel="noopener noreferrer">
          {messages.home.registerNow}
        </ButtonLink>
      </div>
    </section>
  )
}
