'use client'

import * as React from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { AnnouncementDTO } from '@/lib/types'
import { messages } from '@/lib/messages'

/** REQ-075: dismissible; dismissal persisted in sessionStorage. */
export function AnnouncementBar({ announcement }: { announcement: AnnouncementDTO }) {
  const key = `announcement_dismissed_${announcement.id}`
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    try {
      if (window.sessionStorage.getItem(key) === '1') setVisible(false)
    } catch {
      /* storage blocked */
    }
  }, [key])

  if (!visible) return null

  function dismiss() {
    try {
      window.sessionStorage.setItem(key, '1')
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  return (
    <div role="region" aria-label="Announcement" className="bg-plum-900 text-white">
      <div className="container-page flex items-center gap-3 py-2 text-sm">
        <p className="flex-1">
          <strong className="font-semibold">{announcement.title}</strong>
          <span className="ml-2 text-plum-100">{announcement.body}</span>
          {announcement.link ? (
            <Link href={announcement.link} className="ml-2 font-semibold underline underline-offset-4">
              {messages.common.readMore}
            </Link>
          ) : null}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={messages.announcement.dismiss}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-white/10"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
