'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'
import { PasswordInput } from './PasswordInput'
import { signupSchema, verifyCodeSchema } from '@/lib/utils/validation'
import { messages } from '@/lib/messages'

/** REQ-123 / REQ-123A. After the form submits, a 6-digit code is emailed. The user enters it
 *  here before they can log in. Client validation is supplementary; the server re-validates (REQ-008). */
export function SignupForm({ redirect }: { redirect: string }) {
  const [values, setValues] = React.useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  // null = form, 'pending' = code-entry step, 'done' = verified
  const [stage, setStage] = React.useState<null | 'pending' | 'done'>(null)
  const [pendingEmail, setPendingEmail] = React.useState('')
  const [code, setCode] = React.useState('')
  const [codeError, setCodeError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

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
        setPendingEmail(values.email)
        setStage('pending')
      } else {
        setFormError(res.status === 429 ? messages.auth.rateLimited : (body.error?.message ?? messages.common.somethingWrong))
      }
    } catch {
      setFormError(messages.errors.network)
    } finally {
      setBusy(false)
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault()
    setCodeError(null)
    const parsed = verifyCodeSchema.safeParse({ email: pendingEmail, code })
    if (!parsed.success) {
      setCodeError(parsed.error.issues[0]?.message ?? 'Invalid code')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/account/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code }),
      })
      const body = (await res.json().catch(() => ({}))) as { message?: string; error?: { message?: string } }
      if (res.ok) {
        setStage('done')
      } else {
        setCodeError(res.status === 429 ? messages.auth.rateLimited : (body.error?.message ?? messages.auth.verifyCodeInvalid))
      }
    } catch {
      setCodeError(messages.errors.network)
    } finally {
      setBusy(false)
    }
  }

  if (stage === 'done') {
    return (
      <div className="space-y-4" role="status">
        <p className="rounded-md bg-green-50 px-3 py-3 text-sm font-medium text-success-text dark:bg-green-950/40 dark:text-green-300">
          {messages.auth.verifyCodeDone}
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

  if (stage === 'pending') {
    return (
      <form onSubmit={onVerify} noValidate className="space-y-4" data-testid="verify-email-form">
        <p className="rounded-md bg-blue-50 px-3 py-3 text-sm font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
          {messages.auth.signupCodeSent}
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
              required
              maxLength={6}
              placeholder={messages.auth.verifyCodePlaceholder}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          )}
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {messages.auth.verifyCodeButton}
        </Button>
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
