'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/input'
import { PasswordInput } from './PasswordInput'
import { messages } from '@/lib/messages'

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) setDone(true)
      else {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        setError(body.error?.message ?? messages.auth.resetInvalid)
      }
    } catch {
      setError(messages.errors.network)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4" role="status">
        <p className="rounded-md bg-green-50 px-3 py-3 text-sm font-medium text-success-text dark:bg-green-950/40 dark:text-green-300">
          {messages.auth.resetDone}
        </p>
        <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4">
          {messages.auth.login}
        </Link>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormField id="rp-password" label={messages.auth.newPassword} hint="At least 8 characters">
        {(p) => <PasswordInput {...p} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
      </FormField>
      <FormField id="rp-confirm" label={messages.auth.confirmPassword} error={error}>
        {(p) => <PasswordInput {...p} autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {messages.auth.setPassword}
      </Button>
    </form>
  )
}
