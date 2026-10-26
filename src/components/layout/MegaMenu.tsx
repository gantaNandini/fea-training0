'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { CategoryDTO } from '@/lib/types'
import { messages } from '@/lib/messages'
import { cn } from '@/lib/utils/cn'

/** WAI-ARIA Disclosure pattern (REQ-033): aria-expanded/aria-controls, Enter/Space opens, Esc closes. */
export function MegaMenu({ categories }: { categories: CategoryDTO[] }) {
  const [open, setOpen] = React.useState(false)
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelId = React.useId()

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-11 items-center gap-1.5 rounded-md px-3 font-semibold hover:bg-muted"
      >
        {messages.nav.courses}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute left-0 top-full z-40 w-[min(56rem,90vw)] pt-2"
      >
        <nav
          aria-label={messages.nav.courses}
          className="grid gap-x-8 gap-y-6 rounded-xl border border-border bg-card p-6 shadow-lg sm:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((cat) => (
            <div key={cat.id}>
              <Link
                href={`/courses?category=${cat.slug}`}
                onClick={close}
                className="font-display text-base font-bold text-foreground hover:text-link hover:underline"
              >
                {cat.name}
              </Link>
              {cat.children.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {cat.children.map((ch) => (
                    <li key={ch.id}>
                      <Link
                        href={`/courses?category=${ch.slug}`}
                        onClick={close}
                        className="block rounded-sm py-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        {ch.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-3">
            <Link
              href="/courses"
              onClick={close}
              className="inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline"
            >
              {messages.nav.allCourses}
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
