'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import type { TestimonialDTO } from '@/lib/types'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

function TestimonialCard({ t }: { t: TestimonialDTO }) {
  const [open, setOpen] = React.useState(false)
  return (
    <figure className="flex h-full w-[85%] shrink-0 snap-center flex-col rounded-xl border border-border bg-card p-6 sm:w-[46%] lg:w-[31%]">
      <Quote className="h-6 w-6 text-plum-400" aria-hidden="true" />
      <blockquote className="mt-3 flex-1 text-sm">
        <p className={cn(!open && 'line-clamp-3')}>{t.quote}</p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-2 min-h-11 font-semibold text-link underline-offset-4 hover:underline"
        >
          {open ? messages.common.readLess : messages.common.readMore}
        </button>
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
          <PlaceholderArt src={t.photo ?? 'placeholder:avatar'} alt={`Photo of ${t.name}`} label={t.name} fill sizes="48px" className="object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{t.name}</span>
          <span className="block truncate text-sm text-muted-foreground">
            {t.role}
            {t.company ? `, ${t.company}` : ''}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}

/** Scroll-snap carousel (REQ-071): native swipe, arrow keys, dot indicators. */
export function Testimonials({ items }: { items: TestimonialDTO[] }) {
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState(0)

  const onScroll = React.useCallback(() => {
    const el = trackRef.current
    if (!el || el.children.length === 0) return
    const first = el.children[0] as HTMLElement
    const step = first.offsetWidth + 16
    setActive(Math.min(items.length - 1, Math.round(el.scrollLeft / step)))
  }, [items.length])

  function scrollToIndex(i: number) {
    const el = trackRef.current
    if (!el) return
    const child = el.children[Math.max(0, Math.min(items.length - 1, i))] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      scrollToIndex(active + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      scrollToIndex(active - 1)
    }
  }

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={messages.home.testimonials}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin]"
      >
        {items.map((t) => (
          <TestimonialCard key={t.id} t={t} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => scrollToIndex(active - 1)}
          aria-label={messages.home.previousTestimonial}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center">
          {items.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`${messages.home.goToTestimonial} ${i + 1}`}
              aria-current={i === active}
              className="inline-flex h-11 w-6 items-center justify-center"
            >
              <span className={cn('block h-2.5 w-2.5 rounded-full', i === active ? 'bg-plum-700 dark:bg-plum-300' : 'bg-slate-300 dark:bg-slate-600')} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => scrollToIndex(active + 1)}
          aria-label={messages.home.nextTestimonial}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border hover:bg-muted"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
