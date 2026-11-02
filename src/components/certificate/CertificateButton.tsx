'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Shown on a My courses card at 100%. Issues the certificate on first click, then opens it. */
export function CertificateButton({ courseId, code }: { courseId: string; code?: string }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)

  async function open() {
    if (code) return router.push(`/certificate/${code}`)
    setBusy(true)
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const json = (await res.json()) as { code?: string; error?: { message?: string } }
      if (res.ok && json.code) router.push(`/certificate/${json.code}`)
      else toast.error(json.error?.message ?? 'Could not issue the certificate.')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button type="button" variant="outline" className="mt-2 w-full" onClick={open} disabled={busy} data-testid="get-certificate">
      <Award className="h-4 w-4" aria-hidden="true" />
      {busy ? 'Preparing…' : code ? 'View certificate' : 'Get certificate'}
    </Button>
  )
}
