'use client'

import * as React from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'
import { PasswordInput } from './PasswordInput'
import { messages } from '@/lib/messages'

/**
 * REQ-122. After success we navigate to /post-login, which calls POST /api/cart/merge once and then
 * returns the user to a validated `redirect` (REQ-125, REQ-127). "Remember me" is UI-only in Phase 1
 * (the JWT lifetime is fixed at 30 days) — documented in README.
 */
export function LoginForm({ redirect, googleEnabled }: { redirect: string; googleEnabled: boolean }) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [remember, setRemember] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const target = `/post-login?redirect=${encodeURIComponent(redirect)}`

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
      window.location.assign(target)
    } catch {
      setError(messages.errors.network)
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} noValidate className="space-y-4" aria-describedby={error ? 'login-error' : undefined}>
        {error ? (
          <p id="login-error" role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-danger-text dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <FormField id="login-email" label={messages.auth.email}>
          {(p) => (
            <Input {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </FormField>
        <FormField id="login-password" label={messages.auth.password}>
          {(p) => (
            <PasswordInput {...p} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </FormField>
        <div className="flex items-center justify-between">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-5 w-5 accent-plum-700"
            />
            {messages.auth.remember}
          </label>
          <Link href="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline-offset-4 hover:underline">
            {messages.auth.forgot}
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? messages.auth.signingIn : messages.auth.login}
        </Button>
      </form>

      {googleEnabled ? (
        <>
          <div className="flex items-center gap-3 text-sm text-muted-foreground" role="separator">
            <span className="h-px flex-1 bg-border" />
            {messages.auth.or}
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" size="lg" className="w-full" onClick={() => signIn('google', { callbackUrl: target })}>
            {messages.auth.google}
          </Button>
        </>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        {messages.auth.noAccount}{' '}
        <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-link underline-offset-4 hover:underline">
          {messages.nav.signup}
        </Link>
      </p>
    </div>
  )
}
