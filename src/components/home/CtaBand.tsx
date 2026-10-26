'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/input'
import { messages } from '@/lib/messages'

/** Newsletter CTA band (REQ-076): server upserts; duplicates are accepted silently. */
export function CtaBand() {
  const [email, setEmail] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        toast.success(messages.home.subscribed)
        setEmail('')
      } else {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        setError(body.error?.message ?? messages.common.somethingWrong)
      }
    } catch {
      setError(messages.errors.network)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="gradient-brand text-white" aria-labelledby="cta-heading">
      <div className="container-page section-y grid items-center gap-8 lg:grid-cols-2">
        <div>
          <h2 id="cta-heading" className="text-white">{messages.home.ctaHeading}</h2>
          <p className="mt-3 text-white">{messages.home.ctaSub}</p>
        </div>
        <form onSubmit={onSubmit} noValidate>
          <Label htmlFor="newsletter-email" className="text-white">
            {messages.home.emailLabel}
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={messages.home.emailPlaceholder}
              aria-invalid={!!error}
              aria-describedby={error ? 'newsletter-error' : undefined}
              className="h-12 flex-1 rounded-md border-0 bg-white px-4 text-slate-900 placeholder:text-slate-500"
            />
            <Button type="submit" size="lg" disabled={busy} className="!bg-plum-900 !bg-none text-white hover:!bg-plum-800">
              {messages.home.subscribe}
            </Button>
          </div>
          {error ? (
            <p id="newsletter-error" role="alert" className="mt-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-danger-text">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  )
}
