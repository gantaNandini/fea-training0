'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { messages } from '@/lib/messages'

/** Requirements list: collapsed with "View more" when there are more than 5 items (REQ-094). */
export function RequirementsList({ items }: { items: string[] }) {
  const [open, setOpen] = React.useState(false)
  const limit = 5
  const shown = open ? items : items.slice(0, limit)
  return (
    <div>
      <ul className="list-disc space-y-2 pl-5">
        {shown.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {items.length > limit ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="mt-2 min-h-11 font-semibold text-link underline-offset-4 hover:underline"
        >
          {open ? messages.common.viewLess : messages.common.viewMore}
        </button>
      ) : null}
    </div>
  )
}

export function OutcomesList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {items.map((o) => (
        <li key={o} className="flex gap-3">
          <Check className="mt-1 h-4 w-4 shrink-0 text-success-text dark:text-green-400" aria-hidden="true" />
          <span>{o}</span>
        </li>
      ))}
    </ul>
  )
}

/** Rich description truncated at roughly 200 words with "View more" (REQ-094). HTML is pre-sanitised. */
export function ExpandableHtml({ html, wordCount }: { html: string; wordCount: number }) {
  const long = wordCount > 200
  const [open, setOpen] = React.useState(!long)
  return (
    <div>
      <div className="relative">
        <div
          className={`prose-content ${open ? '' : 'max-h-72 overflow-hidden'}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!open ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-background to-transparent"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {long ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="mt-2 min-h-11 font-semibold text-link underline-offset-4 hover:underline"
        >
          {open ? messages.common.viewLess : messages.common.viewMore}
        </button>
      ) : null}
    </div>
  )
}
