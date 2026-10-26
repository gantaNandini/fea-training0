import { Award, Infinity as InfinityIcon, MonitorPlay } from 'lucide-react'
import { getPublishedCourseCount } from '@/lib/data/courses'
import { getSettings } from '@/lib/data/settings'
import { messages } from '@/lib/messages'

/** REQ-064: the course count is computed (PUBLISHED only), never hardcoded. */
export async function ValueStrip() {
  const [count, settings] = await Promise.all([getPublishedCourseCount(), getSettings()])
  const items = [
    { Icon: MonitorPlay, title: `${count} ${messages.home.onlineCourses}`, sub: null as string | null },
    { Icon: Award, title: messages.home.valueExpert, sub: settings.value_strip_item2_sub ?? null },
    { Icon: InfinityIcon, title: messages.home.valueLifetime, sub: settings.value_strip_item3_sub ?? null },
  ]
  return (
    <section className="gradient-brand text-white" data-testid="value-strip" aria-label="Highlights">
      <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
        {items.map(({ Icon, title, sub }) => (
          <div key={title} className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">{title}</p>
              {sub ? <p className="text-sm text-white">{sub}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
