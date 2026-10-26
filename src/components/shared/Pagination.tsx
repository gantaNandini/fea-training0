import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { messages } from '@/lib/messages'

/** Numbered pagination; every link keeps the current query string (REQ-085). */
export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number
  totalPages: number
  hrefFor: (page: number) => string
}) {
  if (totalPages <= 1) return null
  const pages: (number | 'gap')[] = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p)
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap')
  }
  const item =
    'inline-flex h-11 min-w-11 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted'
  return (
    <nav aria-label={messages.catalogue.pagination} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={item} aria-label={messages.common.previous} rel="prev">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
      {pages.map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-label={`${messages.catalogue.page} ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(item, p === page && 'border-transparent bg-primary text-primary-foreground hover:bg-primary')}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={item} aria-label={messages.common.next} rel="next">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  )
}
