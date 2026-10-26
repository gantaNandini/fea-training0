'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'
import type { CategoryDTO } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { activeFilterCount, toQueryString, type CatalogueState } from '@/lib/utils/catalogue-params'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

const LEVELS = [
  { value: 'BEGINNER', label: messages.course.levelBeginner },
  { value: 'INTERMEDIATE', label: messages.course.levelIntermediate },
  { value: 'ADVANCED', label: messages.course.levelAdvanced },
]

function FilterPanel({
  categories,
  languages,
  state,
  idp,
}: {
  categories: CategoryDTO[]
  languages: string[]
  state: CatalogueState
  idp: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [min, setMin] = React.useState(state.minPrice != null ? String(state.minPrice / 100) : '')
  const [max, setMax] = React.useState(state.maxPrice != null ? String(state.maxPrice / 100) : '')

  function push(next: Partial<CatalogueState>) {
    // any filter change resets pagination
    router.push(`${pathname}${toQueryString({ ...state, ...next, page: 1 })}`, { scroll: false })
  }

  function toggle(list: string[] | undefined, value: string): string[] | undefined {
    const set = new Set(list ?? [])
    if (set.has(value)) set.delete(value)
    else set.add(value)
    return set.size ? Array.from(set) : undefined
  }

  function applyRange(e: React.FormEvent) {
    e.preventDefault()
    const toPaise = (v: string) => (v.trim() === '' ? undefined : Math.max(0, Math.round(Number(v) * 100)))
    const lo = toPaise(min)
    const hi = toPaise(max)
    push({
      minPrice: lo != null && Number.isFinite(lo) ? lo : undefined,
      maxPrice: hi != null && Number.isFinite(hi) ? hi : undefined,
    })
  }

  const legend = 'mb-2 font-display text-sm font-bold'
  const row = 'flex min-h-11 cursor-pointer items-center gap-3 text-sm'
  const catBtn = (active: boolean) =>
    cn(
      'flex min-h-11 w-full items-center rounded-md px-2 text-left text-sm hover:bg-muted',
      active && 'bg-plum-50 font-semibold text-plum-800 dark:bg-plum-900 dark:text-plum-100',
    )

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className={legend}>{messages.catalogue.category}</legend>
        <div className="space-y-0.5">
          <button type="button" className={catBtn(!state.category)} aria-pressed={!state.category} onClick={() => push({ category: undefined })}>
            {messages.catalogue.allCategories}
          </button>
          {categories.map((c) => (
            <div key={c.id}>
              <button type="button" className={catBtn(state.category === c.slug)} aria-pressed={state.category === c.slug} onClick={() => push({ category: c.slug })}>
                {c.name}
              </button>
              {c.children.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  className={cn(catBtn(state.category === ch.slug), 'pl-6')}
                  aria-pressed={state.category === ch.slug}
                  onClick={() => push({ category: ch.slug })}
                >
                  {ch.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>{messages.catalogue.price}</legend>
        {(
          [
            ['all', messages.catalogue.priceAll],
            ['free', messages.catalogue.priceFree],
            ['paid', messages.catalogue.pricePaid],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className={row}>
            <input
              type="radio"
              name={`${idp}-price`}
              checked={(state.price ?? 'all') === value}
              onChange={() => push({ price: value === 'all' ? undefined : value })}
              className="h-5 w-5 accent-plum-700"
            />
            {label}
          </label>
        ))}
        <form onSubmit={applyRange} className="mt-2 flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor={`${idp}-min`} className="mb-1 block text-xs text-muted-foreground">
              {messages.catalogue.priceMin}
            </label>
            <input
              id={`${idp}-min`}
              inputMode="numeric"
              type="number"
              min={0}
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="h-11 w-full rounded-md border border-slate-400 bg-card px-2 text-sm dark:border-slate-600"
            />
          </div>
          <div className="flex-1">
            <label htmlFor={`${idp}-max`} className="mb-1 block text-xs text-muted-foreground">
              {messages.catalogue.priceMax}
            </label>
            <input
              id={`${idp}-max`}
              inputMode="numeric"
              type="number"
              min={0}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="h-11 w-full rounded-md border border-slate-400 bg-card px-2 text-sm dark:border-slate-600"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" className="h-11">
            {messages.catalogue.applyPrice}
          </Button>
        </form>
      </fieldset>

      <fieldset>
        <legend className={legend}>{messages.catalogue.level}</legend>
        {LEVELS.map((l) => (
          <label key={l.value} className={row}>
            <input
              type="checkbox"
              checked={!!state.levels?.includes(l.value)}
              onChange={() => push({ levels: toggle(state.levels, l.value) })}
              className="h-5 w-5 accent-plum-700"
            />
            {l.label}
          </label>
        ))}
      </fieldset>

      {languages.length > 0 ? (
        <fieldset>
          <legend className={legend}>{messages.catalogue.language}</legend>
          {languages.map((l) => (
            <label key={l} className={row}>
              <input
                type="checkbox"
                checked={!!state.languages?.includes(l)}
                onChange={() => push({ languages: toggle(state.languages, l) })}
                className="h-5 w-5 accent-plum-700"
              />
              {l}
            </label>
          ))}
        </fieldset>
      ) : null}

      <fieldset>
        <legend className={legend}>{messages.catalogue.rating}</legend>
        {(
          [
            [undefined, messages.catalogue.ratingAll],
            [4, messages.catalogue.rating4],
            [3, messages.catalogue.rating3],
            [2, messages.catalogue.rating2],
          ] as const
        ).map(([value, label]) => (
          <label key={label} className={row}>
            <input
              type="radio"
              name={`${idp}-rating`}
              checked={state.minRating === value}
              onChange={() => push({ minRating: value })}
              className="h-5 w-5 accent-plum-700"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => router.push(pathname, { scroll: false })}
        disabled={activeFilterCount(state) === 0}
      >
        {messages.catalogue.clearFilters}
      </Button>
    </div>
  )
}

/**
 * Left sidebar >= 1024 px; below that a "Filters" button (with active-count badge) opens a bottom
 * drawer (REQ-081, REQ-082). All filters are reflected in the URL.
 */
export function FilterSidebar({
  categories,
  languages,
  state,
}: {
  categories: CategoryDTO[]
  languages: string[]
  state: CatalogueState
}) {
  const count = activeFilterCount(state)
  return (
    <>
      <aside aria-label={messages.catalogue.filters} className="hidden lg:block">
        <FilterPanel categories={categories} languages={languages} state={state} idp="d" />
      </aside>
      <div className="lg:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="filters-button">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {messages.catalogue.filters}
              {count > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-plum-700 px-1.5 text-xs font-bold text-white">
                  {count}
                </span>
              ) : null}
            </Button>
          </DialogTrigger>
          <DialogContent side="bottom" aria-describedby={undefined}>
            <DialogTitle className="mb-4 font-display text-lg font-bold">{messages.catalogue.filters}</DialogTitle>
            <FilterPanel categories={categories} languages={languages} state={state} idp="m" />
            <DialogClose asChild>
              <Button className="mt-6 w-full">{messages.catalogue.showResults}</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
