'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'
import { messages } from '@/lib/messages'

/** REQ-124: always shows the same success message. */
export function ForgotForm() {
  const [email, setEmail] = React.useState('')
  const [done, setDone] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/account/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setDone(messages.auth.forgotDone)
      else if (res.status === 429) setError(messages.auth.rateLimited)
      else setError(messages.common.somethingWrong)
    } catch {
      setError(messages.errors.network)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p role="status" className="rounded-md bg-green-50 px-3 py-3 text-sm font-medium text-success-text dark:bg-green-950/40 dark:text-green-300">
        {done}
      </p>
    )
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField id="fp-email" label={messages.auth.email} error={error}>
        {(p) => <Input {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {messages.auth.sendLink}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-link underline-offset-4 hover:underline">
          {messages.auth.login}
        </Link>
      </p>
    </form>
  )
}
