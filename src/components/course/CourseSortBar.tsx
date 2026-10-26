'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { toQueryString, type CatalogueState } from '@/lib/utils/catalogue-params'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

const SORTS = [
  ['newest', messages.catalogue.sortNewest],
  ['price-asc', messages.catalogue.sortPriceAsc],
  ['price-desc', messages.catalogue.sortPriceDesc],
  ['rating', messages.catalogue.sortRating],
  ['popular', messages.catalogue.sortPopular],
] as const

/** Result count + sort dropdown + grid/list toggle (REQ-083). */
export function CourseSortBar({ total, state }: { total: number; state: CatalogueState }) {
  const router = useRouter()
  const pathname = usePathname()
  const push = (next: Partial<CatalogueState>) =>
    router.push(`${pathname}${toQueryString({ ...state, ...next })}`, { scroll: false })

  const toggle = 'inline-flex h-11 w-11 items-center justify-center rounded-md border border-border'
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" role="status" data-testid="result-count">
        {messages.catalogue.showing} <strong className="text-foreground">{total}</strong> {messages.home.courseCount}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium">
            {messages.catalogue.sortBy}
          </label>
          <select
            id="sort-select"
            value={state.sort ?? 'newest'}
            onChange={(e) => push({ sort: e.target.value as CatalogueState['sort'], page: 1 })}
            className="h-11 rounded-md border border-slate-400 bg-card px-3 text-sm dark:border-slate-600"
          >
            {SORTS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1" role="group" aria-label="View">
          <button
            type="button"
            aria-label={messages.catalogue.gridView}
            aria-pressed={state.view === 'grid'}
            onClick={() => push({ view: 'grid' })}
            className={cn(toggle, state.view === 'grid' && 'bg-muted')}
          >
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={messages.catalogue.listView}
            aria-pressed={state.view === 'list'}
            onClick={() => push({ view: 'list' })}
            className={cn(toggle, state.view === 'list' && 'bg-muted')}
          >
            <List className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
