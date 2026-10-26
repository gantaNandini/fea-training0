'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import type { SearchSuggestionsDTO } from '@/lib/types'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

/** Live suggestions after >= 2 chars: up to 8 courses + 4 categories (REQ-034). */
export function SearchBar({
  className,
  autoFocus,
  onNavigate,
}: {
  className?: string
  autoFocus?: boolean
  onNavigate?: () => void
}) {
  const router = useRouter()
  const [q, setQ] = React.useState('')
  const [data, setData] = React.useState<SearchSuggestionsDTO | null>(null)
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const listId = React.useId()

  React.useEffect(() => {
    if (q.trim().length < 2) {
      setData(null)
      return
    }
    const ctl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctl.signal })
        if (res.ok) {
          setData((await res.json()) as SearchSuggestionsDTO)
          setOpen(true)
          setActive(-1)
        }
      } catch {
        /* aborted */
      }
    }, 200)
    return () => {
      clearTimeout(t)
      ctl.abort()
    }
  }, [q])

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const options = React.useMemo(() => {
    if (!data) return []
    return [
      ...data.courses.map((c) => ({ key: `c-${c.slug}`, label: c.title, href: `/courses/${c.slug}`, group: 'course' as const })),
      ...data.categories.map((c) => ({ key: `k-${c.slug}`, label: c.name, href: `/courses?category=${c.slug}`, group: 'category' as const })),
    ]
  }, [data])

  function go(href: string) {
    setOpen(false)
    setQ('')
    onNavigate?.()
    router.push(href)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (active >= 0 && options[active]) return go(options[active].href)
    const term = q.trim()
    if (term) go(`/courses?q=${encodeURIComponent(term)}`)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && data !== null
  const empty = data && options.length === 0

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <form role="search" onSubmit={onSubmit}>
        <label htmlFor={`${listId}-input`} className="sr-only">
          {messages.nav.searchLabel}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            id={`${listId}-input`}
            type="search"
            value={q}
            autoFocus={autoFocus}
            autoComplete="off"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => data && setOpen(true)}
            placeholder={messages.nav.searchPlaceholder}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
            className="h-11 w-full rounded-full border border-slate-400 bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-slate-500 dark:border-slate-600"
          />
        </div>
      </form>
      <ul
        id={listId}
        role="listbox"
        hidden={!showList}
        className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-lg"
      >
        {empty ? <li className="px-3 py-3 text-sm text-muted-foreground">{messages.nav.noResults}</li> : null}
        {options.map((o, i) => (
          <li
            key={o.key}
            id={`${listId}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault()
              go(o.href)
            }}
            className={cn(
              'flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm',
              i === active ? 'bg-muted' : 'hover:bg-muted',
            )}
          >
            <span className="line-clamp-1">{o.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {o.group === 'course' ? messages.nav.suggestedCourses : messages.nav.suggestedCategories}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
