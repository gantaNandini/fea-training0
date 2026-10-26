'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField, Input, Textarea } from '@/components/ui/input'
import { contactSchema } from '@/lib/utils/validation'
import { messages } from '@/lib/messages'

export function ContactForm() {
  const [values, setValues] = React.useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = contactSchema.safeParse(values)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message
      return setErrors(next)
    }
    setErrors({})
    setBusy(true)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    setBusy(false)
    if (res.ok) {
      setSent(true)
      setValues({ name: '', email: '', subject: '', message: '' })
      toast.success(messages.contact.sent)
    } else toast.error(res.status === 429 ? messages.errors.network : messages.common.somethingWrong)
  }

  if (sent) {
    return (
      <p role="status" className="rounded-lg border border-border bg-muted p-6 font-medium">
        {messages.contact.sent}
      </p>
    )
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormField id="ct-name" label={messages.contact.name} error={errors.name}>
        {(p) => <Input {...p} autoComplete="name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />}
      </FormField>
      <FormField id="ct-email" label={messages.contact.email} error={errors.email}>
        {(p) => <Input {...p} type="email" autoComplete="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />}
      </FormField>
      <FormField id="ct-subject" label={messages.contact.subject} error={errors.subject}>
        {(p) => <Input {...p} value={values.subject} onChange={(e) => setValues({ ...values, subject: e.target.value })} />}
      </FormField>
      <FormField id="ct-message" label={messages.contact.message} error={errors.message}>
        {(p) => <Textarea {...p} rows={6} value={values.message} onChange={(e) => setValues({ ...values, message: e.target.value })} />}
      </FormField>
      <Button type="submit" disabled={busy}>
        {busy ? messages.checkout.processing : messages.contact.send}
      </Button>
    </form>
  )
}
