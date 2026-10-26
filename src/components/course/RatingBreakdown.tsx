import type { RatingBreakdownDTO } from '@/lib/types'
import { StarRating } from '@/components/shared/StarRating'
import { messages } from '@/lib/messages'

/** Average (1 decimal) + five bars from approved reviews only (REQ-097). */
export function RatingBreakdown({ data }: { data: RatingBreakdownDTO }) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center" data-testid="rating-breakdown">
      <div className="text-center sm:w-40">
        {data.average == null ? (
          <p className="font-display text-lg font-bold">{messages.course.noRatings}</p>
        ) : (
          <>
            <p className="font-display text-5xl font-extrabold">{data.average.toFixed(1)}</p>
            <div className="mt-1 flex justify-center">
              <StarRating value={data.average} count={data.total} compact size="md" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.total} {messages.course.reviews}
            </p>
          </>
        )}
      </div>
      <ul className="flex-1 space-y-2" aria-label={messages.course.feedback}>
        {[5, 4, 3, 2, 1].map((star) => {
          const n = data.counts[star - 1]
          const pct = data.total > 0 ? Math.round((n / data.total) * 100) : 0
          return (
            <li key={star} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0">{star} star</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted" role="presentation">
                <span className="block h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">{pct}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
