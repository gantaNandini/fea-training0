'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormField, Input, Textarea } from '@/components/ui/input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { useUserState } from '@/hooks/useUserState'
import { passwordChangeSchema, profileSchema } from '@/lib/utils/validation'
import { messages } from '@/lib/messages'

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string; bio: string; image: string | null }
}) {
  const router = useRouter()
  const { refresh } = useUserState()
  const [values, setValues] = React.useState({ name: initial.name, phone: initial.phone, bio: initial.bio })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState(false)
  const [image, setImage] = React.useState(initial.image)
  const [uploading, setUploading] = React.useState(false)
  const [avatarError, setAvatarError] = React.useState<string | null>(null)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const parsed = profileSchema.safeParse(values)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message
      return setErrors(next)
    }
    setErrors({})
    setBusy(true)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setBusy(false)
    if (res.ok) {
      toast.success(messages.student.profileSaved)
      await refresh()
      router.refresh()
    } else toast.error(messages.common.somethingWrong)
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    if (file.size > 2 * 1024 * 1024) return setAvatarError('The image must be 2 MB or smaller.')
    setUploading(true)
    const form = new FormData()
    form.append('avatar', file)
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
    setUploading(false)
    const body = (await res.json().catch(() => ({}))) as { image?: string; error?: { message?: string } }
    if (res.ok && body.image) {
      setImage(body.image)
      toast.success(messages.student.profileSaved)
      await refresh()
    } else setAvatarError(body.error?.message ?? messages.common.somethingWrong)
  }

  return (
    <div className="space-y-8">
      <section className="flex items-center gap-5" aria-label={messages.student.avatar}>
        <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
          <PlaceholderArt src={image ?? 'placeholder:avatar'} alt={initial.name || 'Profile photo'} label={initial.name} fill sizes="96px" className="object-cover" />
        </span>
        <div>
          <label
            htmlFor="avatar-input"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted"
          >
            {uploading ? messages.common.loading : messages.student.uploadAvatar}
          </label>
          <input id="avatar-input" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={upload} disabled={uploading} />
          <p className="mt-1 text-xs text-muted-foreground">{messages.student.avatarHint}</p>
          {avatarError ? <p role="alert" className="mt-1 text-sm font-medium text-danger-text dark:text-red-300">{avatarError}</p> : null}
        </div>
      </section>

      <form onSubmit={save} noValidate className="space-y-4">
        <FormField id="pf-name" label={messages.auth.name} error={errors.name}>
          {(p) => <Input {...p} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />}
        </FormField>
        <FormField id="pf-email" label={messages.auth.email}>
          {(p) => <Input {...p} value={initial.email} readOnly disabled />}
        </FormField>
        <FormField id="pf-phone" label={messages.student.phone} error={errors.phone}>
          {(p) => <Input {...p} type="tel" autoComplete="tel" value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} />}
        </FormField>
        <FormField id="pf-bio" label={messages.student.bio} error={errors.bio}>
          {(p) => <Textarea {...p} value={values.bio} onChange={(e) => setValues({ ...values, bio: e.target.value })} />}
        </FormField>
        <Button type="submit" disabled={busy}>
          {busy ? messages.common.saving : messages.common.save}
        </Button>
      </form>
    </div>
  )
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [values, setValues] = React.useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState(false)

  if (!hasPassword) {
    return <p className="text-sm text-muted-foreground">This account signs in with Google, so there is no password to change.</p>
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = passwordChangeSchema.safeParse(values)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message
      return setErrors(next)
    }
    setErrors({})
    setBusy(true)
    const res = await fetch('/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setBusy(false)
    if (res.ok) {
      toast.success(messages.student.passwordChanged)
      // sessionVersion changed: every JWT is now stale, so sign out and log in again
      await signOut({ callbackUrl: '/login' })
    } else {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      setErrors({ currentPassword: body.error?.message ?? messages.common.somethingWrong })
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <FormField id="pw-current" label={messages.auth.currentPassword} error={errors.currentPassword}>
        {(p) => <PasswordInput {...p} autoComplete="current-password" value={values.currentPassword} onChange={(e) => setValues({ ...values, currentPassword: e.target.value })} />}
      </FormField>
      <FormField id="pw-new" label={messages.auth.newPassword} error={errors.newPassword} hint="At least 8 characters">
        {(p) => <PasswordInput {...p} autoComplete="new-password" value={values.newPassword} onChange={(e) => setValues({ ...values, newPassword: e.target.value })} />}
      </FormField>
      <FormField id="pw-confirm" label={messages.auth.confirmPassword} error={errors.confirmPassword}>
        {(p) => <PasswordInput {...p} autoComplete="new-password" value={values.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })} />}
      </FormField>
      <Button type="submit" disabled={busy}>
        {messages.student.changePassword}
      </Button>
    </form>
  )
}
