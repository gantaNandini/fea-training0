'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'
import { eventRegistrationSchema } from '@/lib/utils/validation'

const EMPTY = { fullName: '', email: '', phone: '', organisation: '', designation: '' }

/** Registration form for a webinar or workshop. Posts to /api/events/[id]/register. */
export function EventRegistrationForm({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [values, setValues] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState<string | null>(null)

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [k]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = eventRegistrationSchema.safeParse(values)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message
      return setErrors(next)
    }
    setErrors({})
    setBusy(true)
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (res.ok) {
        setDone(parsed.data.email)
        setValues(EMPTY)
        return
      }
      const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null
      if (body?.error?.code === 'ALREADY_REGISTERED') setErrors({ email: body.error.message ?? 'Already registered.' })
      else toast.error(body?.error?.message ?? 'Something went wrong. Please try again.')
    } catch {
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-5 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
        <p className="font-semibold">You are registered for {eventTitle}.</p>
        <p className="mt-1 text-sm">We will send the joining details to {done}.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4" aria-label={`Register for ${eventTitle}`} data-testid="event-registration-form">
      <FormField id="er-name" label="Full name *" error={errors.fullName}>
        {(p) => <Input {...p} autoComplete="name" value={values.fullName} onChange={set('fullName')} />}
      </FormField>
      <FormField id="er-email" label="Email address *" error={errors.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" value={values.email} onChange={set('email')} />}
      </FormField>
      <FormField id="er-phone" label="Phone number *" error={errors.phone}>
        {(p) => <Input {...p} type="tel" autoComplete="tel" value={values.phone} onChange={set('phone')} />}
      </FormField>
      <FormField id="er-org" label="Organisation / college *" error={errors.organisation}>
        {(p) => <Input {...p} autoComplete="organization" value={values.organisation} onChange={set('organisation')} />}
      </FormField>
      <FormField id="er-desig" label="Designation (if applicable)" error={errors.designation}>
        {(p) => <Input {...p} autoComplete="organization-title" value={values.designation} onChange={set('designation')} />}
      </FormField>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Registering…' : 'Register now'}
      </Button>
    </form>
  )
}
