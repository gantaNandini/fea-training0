'use client'

import * as React from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'
import { PasswordInput } from './PasswordInput'
import { signupSchema } from '@/lib/utils/validation'
import { messages } from '@/lib/messages'

/** REQ-123. Client validation is supplementary; the server re-validates (REQ-008). */
export function SignupForm({ redirect }: { redirect: string }) {
  const [values, setValues] = React.useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  // step 2: the 6-digit code emailed to the student
  const [step, setStep] = React.useState<'details' | 'code'>('details')
  const [code, setCode] = React.useState('')
  const [codeError, setCodeError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [cooldown, setCooldown] = React.useState(0)

  React.useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const parsed = signupSchema.safeParse(values)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message
      setErrors(next)
      return
    }
    setErrors({})
    setBusy(true)
    try {
      const res = await fetch('/api/account/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: { message?: string } }
      if (res.ok) {
        setNotice(body.message ?? messages.auth.codeSent)
        setCode('')
        setCodeError(null)
        setCooldown(60)
        setStep('code')
      } else setFormError(res.status === 429 ? messages.auth.rateLimited : (body.error?.message ?? messages.common.somethingWrong))
    } catch {
      setFormError(messages.errors.network)
    } finally {
      setBusy(false)
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(null)
    if (!/^\d{6}$/.test(code.trim())) {
      setCodeError('Enter the 6-digit code from your email')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/account/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, code: code.trim() }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      if (!res.ok) {
        setCodeError(res.status === 429 && !body.error?.message ? messages.auth.rateLimited : (body.error?.message ?? messages.common.somethingWrong))
        setBusy(false)
        return
      }
      // account exists now: log the student straight in
      const login = await signIn('credentials', { email: values.email, password: values.password, redirect: false })
      if (login && !login.error) {
        window.location.assign(`/post-login?redirect=${encodeURIComponent(redirect)}`)
        return
      }
      setDone(messages.auth.verifyDone)
    } catch {
      setCodeError(messages.errors.network)
    }
    setBusy(false)
  }

  async function onResend() {
    setCodeError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/account/signup/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      if (res.ok) {
        setNotice(messages.auth.codeResent)
        setCooldown(60)
      } else {
        const retry = Number(res.headers.get('Retry-After'))
        if (res.status === 429 && retry > 0) setCooldown(retry)
        setCodeError(res.status === 429 ? messages.auth.rateLimited : (body.error?.message ?? messages.common.somethingWrong))
      }
    } catch {
      setCodeError(messages.errors.network)
    }
  }

  if (done) {
    return (
      <div className="space-y-4" role="status">
        <p className="rounded-md bg-green-50 px-3 py-3 text-sm font-medium text-success-text dark:bg-green-950/40 dark:text-green-300">
          {done}
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4"
        >
          {messages.auth.login}
        </Link>
      </div>
    )
  }

  if (step === 'code') {
    return (
      <form onSubmit={onVerify} noValidate className="space-y-4" data-testid="verify-email-form">
        <h2 className="font-display text-lg font-bold">{messages.auth.verifyTitle}</h2>
        {notice ? (
          <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm font-medium text-success-text dark:bg-green-950/40 dark:text-green-300">
            {notice}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code we sent to <span className="font-semibold text-foreground">{values.email}</span>. It is valid for 10 minutes.
        </p>
        {codeError ? (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-danger-text dark:bg-red-950/40 dark:text-red-300">
            {codeError}
          </p>
        ) : null}
        <FormField id="su-code" label={messages.auth.verifyCodeLabel}>
          {(p) => (
            <Input
              {...p}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              className="text-center text-xl tracking-[0.5em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          )}
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={busy || code.length !== 6}>
          {busy ? messages.auth.verifying : messages.auth.verifyButton}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0}
            className="inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
          >
            {cooldown > 0 ? `${messages.auth.resendIn} ${cooldown}s` : messages.auth.resendCode}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('details')
              setCodeError(null)
              setNotice(null)
            }}
            className="inline-flex min-h-11 items-center font-semibold text-link underline-offset-4 hover:underline"
          >
            {messages.auth.useDifferentEmail}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-danger-text dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </p>
      ) : null}
      <FormField id="su-name" label={messages.auth.name} error={errors.name}>
        {(p) => <Input {...p} autoComplete="name" required value={values.name} onChange={set('name')} />}
      </FormField>
      <FormField id="su-email" label={messages.auth.email} error={errors.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" required value={values.email} onChange={set('email')} />}
      </FormField>
      <FormField id="su-password" label={messages.auth.password} error={errors.password} hint="At least 8 characters">
        {(p) => <PasswordInput {...p} autoComplete="new-password" required value={values.password} onChange={set('password')} />}
      </FormField>
      <FormField id="su-confirm" label={messages.auth.confirmPassword} error={errors.confirmPassword}>
        {(p) => <PasswordInput {...p} autoComplete="new-password" required value={values.confirmPassword} onChange={set('confirmPassword')} />}
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {messages.auth.signup}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {messages.auth.haveAccount}{' '}
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-link underline-offset-4 hover:underline">
          {messages.nav.login}
        </Link>
      </p>
    </form>
  )
}
