import { CheckCircle2, Infinity as InfinityIcon, MonitorPlay, Smartphone } from 'lucide-react'
import type { CourseDetailDTO } from '@/lib/types'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { PriceTag } from '@/components/shared/PriceTag'
import { PurchaseActions } from './PurchaseActions'
import { messages } from '@/lib/messages'

/** Sticky purchase card (desktop right column) — REQ-099. Thumbnail uses next/image priority (REQ-302). */
export function PurchaseCard({ course }: { course: CourseDetailDTO }) {
  return (
    <aside
      aria-label="Purchase"
      data-testid="purchase-card"
      className="overflow-hidden rounded-xl border border-border bg-card shadow-md"
    >
      <div className="relative aspect-card bg-muted">
        <PlaceholderArt
          src={course.thumbnail}
          alt={`${course.title} — preview`}
          fill
          priority
          sizes="(min-width: 1024px) 352px, 100vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-5 p-5">
        <PriceTag price={course.price} discountPrice={course.discountPrice} isFree={course.isFree} size="lg" showPercent />
        <PurchaseActions course={course} />
        <div>
          <p className="mb-2 font-display text-sm font-bold">{messages.course.includes}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {course.lessonCount > 0 ? (
              <li className="flex items-center gap-2">
                <MonitorPlay className="h-4 w-4 shrink-0" aria-hidden="true" />
                {course.lessonCount} {messages.course.includeLessons}
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" />
              {messages.course.includeDevices}
            </li>
            <li className="flex items-center gap-2">
              <InfinityIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {messages.course.includeLifetime}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {course.language}
            </li>
          </ul>
        </div>
      </div>
    </aside>
  )
}
