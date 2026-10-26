'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { messages } from '@/lib/messages'

interface ReadProps {
  value: number | null
  count?: number
  size?: 'sm' | 'md'
  /** hide the numeric text */
  compact?: boolean
  className?: string
}

/** Read-only rating (REQ-066): shows "No ratings yet" when there are no approved reviews. */
export function StarRating({ value, count = 0, size = 'sm', compact, className }: ReadProps) {
  if (value == null || count === 0) {
    return (
      <span className={cn('text-xs text-muted-foreground', size === 'md' && 'text-sm', className)}>
        {messages.course.noRatings}
      </span>
    )
  }
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'
  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`${value.toFixed(1)} ${messages.course.ratingOutOf} 5, ${count} ${messages.course.reviews}`}
    >
      {compact ? null : (
        <span className={cn('font-bold text-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {value.toFixed(1)}
        </span>
      )}
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(px, i <= Math.round(value) ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-600')}
          />
        ))}
      </span>
      <span className={cn('text-muted-foreground', size === 'sm' ? 'text-xs' : 'text-sm')}>({count})</span>
    </span>
  )
}

/** Interactive 1–5 selector for the review form (radio group semantics). */
export function StarInput({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (n: number) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted"
        >
          <Star
            className={cn('h-7 w-7', n <= value ? 'fill-amber-500 text-amber-500' : 'text-slate-400')}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}
