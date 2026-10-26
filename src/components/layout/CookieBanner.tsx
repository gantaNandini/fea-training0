'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { messages } from '@/lib/messages'

/** REQ-050..053: first-visit banner; does not trap focus. */
export function CookieBanner() {
  const [show, setShow] = React.useState(false)
  React.useEffect(() => {
    setShow(!document.cookie.split('; ').some((c) => c.startsWith('cookie_consent=')))
  }, [])
  if (!show) return null

  function accept() {
    const maxAge = 365 * 24 * 60 * 60
    document.cookie = `cookie_consent=accepted; Max-Age=${maxAge}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
    setShow(false)
  }

  return (
    <section
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-xl border border-border bg-card p-4 shadow-lg sm:bottom-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          {messages.cookie.text}{' '}
          <Link href="/cookie-policy" className="font-semibold text-link underline underline-offset-4">
            {messages.cookie.policy}
          </Link>
        </p>
        <Button onClick={accept} className="shrink-0">
          {messages.cookie.accept}
        </Button>
      </div>
    </section>
  )
}
