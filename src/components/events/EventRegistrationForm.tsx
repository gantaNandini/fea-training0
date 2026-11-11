'use client'

import * as React from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'

interface Props {
  eventId: string
  eventTitle: string
  seatsLeft: number | null
}

interface FormState {
  fullName: string
  email: string
  phone: string
  organisation: string
  designation: string
}

export function EventRegistrationForm({ eventId, eventTitle, seatsLeft }: Props) {
  const [form, setForm] = React.useState<FormState>({
    fullName: '', email: '', phone: '', organisation: '', designation: '',
  })
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': window.location.origin },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { message?: string; error?: { code: string; message: string } }
      if (!res.ok) {
        if (data.error?.code === 'DUPLICATE') {
          setError('You are already registered for this event. We will send joining details to your email.')
        } else if (data.error?.code === 'SEATS_FULL') {
          setError('Sorry, all seats for this event are taken. Please contact us to join the waitlist.')
        } else {
          setError(data.error?.message ?? 'Something went wrong. Please try again.')
        }
        return
      }
      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/30">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h3 className="font-display text-xl font-bold text-emerald-800 dark:text-emerald-200">
          You&apos;re registered!
        </h3>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
          Thank you for registering for <strong>{eventTitle}</strong>. We&apos;ll send the joining details to your email shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {seatsLeft !== null && seatsLeft <= 10 && seatsLeft > 0 ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Only {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} remaining!
        </p>
      ) : null}

      <FormField id="reg-name" label="Full name *">
        {(p) => (
          <Input {...p} name="fullName" type="text" autoComplete="name" required minLength={2} maxLength={120}
            value={form.fullName} onChange={handleChange} placeholder="Dr. Jane Smith" />
        )}
      </FormField>

      <FormField id="reg-email" label="Work email *">
        {(p) => (
          <Input {...p} name="email" type="email" autoComplete="email" required maxLength={200}
            value={form.email} onChange={handleChange} placeholder="jane@company.com" />
        )}
      </FormField>

      <FormField id="reg-phone" label="Phone number *">
        {(p) => (
          <Input {...p} name="phone" type="tel" autoComplete="tel" required maxLength={20}
            value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
        )}
      </FormField>

      <FormField id="reg-org" label="Organisation / College">
        {(p) => (
          <Input {...p} name="organisation" type="text" autoComplete="organization" maxLength={200}
            value={form.organisation} onChange={handleChange} placeholder="ONGC, L&T, IIT Bombay…" />
        )}
      </FormField>

      <FormField id="reg-desig" label="Designation">
        {(p) => (
          <Input {...p} name="designation" type="text" maxLength={200}
            value={form.designation} onChange={handleChange} placeholder="Stress Engineer, Graduate…" />
        )}
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Registering…</>
        ) : (
          'Register Now'
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your details are stored securely and are only used to send you event information.
      </p>
    </form>
  )
}
