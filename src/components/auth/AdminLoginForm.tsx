'use client'

import * as React from 'react'
import Link from 'next/link'
import { signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'
import { PasswordInput } from './PasswordInput'
import { messages } from '@/lib/messages'

/** Credentials sign-in that only lets ADMIN accounts through. Students are signed straight back out. */
export function AdminLoginForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (!res || res.error) {
        const code = (res as { code?: string } | undefined)?.code
        setError(code === 'rate_limited' ? messages.auth.rateLimited : messages.auth.invalidCredentials)
        setBusy(false)
        return
      }
      const me = await fetch('/api/me/state', { cache: 'no-store' })
      const state = (await me.json()) as { user?: { role?: string } | null }
      if (state.user?.role !== 'ADMIN') {
        await signOut({ redirect: false })
        setError('This account is not an administrator. Students can sign in from the regular login page.')
        setBusy(false)
        return
      }
      window.location.assign('/admin/dashboard')
    } catch {
      setError(messages.errors.network)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby={error ? 'admin-login-error' : undefined}>
        {error ? (
          <p id="admin-login-error" role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-danger-text dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <FormField id="admin-email" label={messages.auth.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
        </FormField>
        <FormField id="admin-password" label={messages.auth.password}>
          {(p) => <PasswordInput {...p} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="admin-login-submit">
          {busy ? messages.auth.signingIn : 'Sign in to admin'}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Not an administrator?{' '}
        <Link href="/login" className="font-semibold text-link underline-offset-4 hover:underline">Student login</Link>
      </p>
    </div>
  )
}
