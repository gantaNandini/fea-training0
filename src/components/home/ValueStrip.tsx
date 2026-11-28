import type { ReactNode } from 'react'
import { getPublishedCourseCount } from '@/lib/data/courses'
import { getSettings } from '@/lib/data/settings'
import { messages } from '@/lib/messages'

/*
 * Highlights band, matching the client's existing site (fea-training.com): a plum-to-red band with
 * solid white icons (target, tick, clock), a bold title and a lighter sub-line.
 * Proportions measured from that site at 1361px wide: band 92px, icon 56px (a little larger than the old site's 45px), title 20px, sub 15px, gap 20px.
 * Gradient: linear-gradient(-45deg, #EC5252, #6E1A52) — matches fea-training.com exactly.
 */
const svgProps = { viewBox: '0 0 24 24', className: 'h-14 w-14 shrink-0', 'aria-hidden': true, focusable: false } as const

const TargetIcon = () => (
  <svg {...svgProps} fill="none" stroke="currentColor" strokeWidth="2.6">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="5.4" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
)
const TickIcon = () => (
  <svg {...svgProps} fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 12.8 9.4 18.6 20.5 5.6" />
  </svg>
)
const ClockIcon = () => (
  <svg {...svgProps} fill="none">
    <circle cx="12" cy="12" r="11" fill="currentColor" />
    <path d="M12 6v6.4l4 2.4" stroke="#6E1A52" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** REQ-064: the course count is computed (PUBLISHED only), never hardcoded. */
export async function ValueStrip() {
  const [count, settings] = await Promise.all([getPublishedCourseCount(), getSettings()])
  const items: Array<{ icon: ReactNode; title: string; sub: string }> = [
    { icon: <TargetIcon />, title: `${count} ${messages.home.onlineCourses}`, sub: settings.value_strip_item1_sub || messages.home.valueCoursesSub },
    { icon: <TickIcon />, title: messages.home.valueExpert, sub: settings.value_strip_item2_sub || messages.home.valueExpertSub },
    { icon: <ClockIcon />, title: messages.home.valueLifetime, sub: settings.value_strip_item3_sub || messages.home.valueLifetimeSub },
  ]
  return (
    <section
      className="bg-[linear-gradient(-45deg,#EC5252,#6E1A52)] text-white"
      data-testid="value-strip"
      aria-label="Highlights"
    >
      <div className="container-page grid gap-y-5 py-[18px] sm:grid-cols-3">
        {items.map(({ icon, title, sub }) => (
          <div key={title} className="flex items-center gap-5">
            {icon}
            <div>
              <p className="font-display text-xl font-bold leading-tight">{title}</p>
              <p className="text-[15px] leading-snug">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
