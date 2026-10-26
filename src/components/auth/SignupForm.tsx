'use client'

import * as React from 'react'
import Link from 'next/link'
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
      if (res.ok) setDone(body.message ?? messages.auth.signupDone)
      else setFormError(res.status === 429 ? messages.auth.rateLimited : (body.error?.message ?? messages.common.somethingWrong))
    } catch {
      setFormError(messages.errors.network)
    } finally {
      setBusy(false)
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
