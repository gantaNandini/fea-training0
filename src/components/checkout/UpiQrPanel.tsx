'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/utils/pricing'

/**
 * Static UPI QR (manual payment). The customer pays, then submits the 12-digit UTR. Nothing is unlocked
 * here: the claim stays PENDING until an admin verifies it against the bank / Razorpay records.
 */
export function UpiQrPanel({
  orderId,
  amount,
  upiId,
  payee,
  onClose,
}: {
  orderId: string
  amount: number
  upiId: string
  payee: string
  onClose: () => void
}) {
  const [utr, setUtr] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, utr }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
      if (res.ok) setDone(true)
      else setError(body.error?.message ?? 'Could not submit. Please try again.')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(upiId)
      toast.success('UPI ID copied.')
    } catch {
      toast.message(upiId)
    }
  }

  if (done) {
    return (
      <section className="mt-6 rounded-xl border border-border bg-card p-5" role="status" data-testid="manual-pending">
        <CheckCircle2 className="h-10 w-10 text-plum-700" aria-hidden="true" />
        <h2 className="mt-3 text-xl">Payment submitted — pending verification</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We received your UTR. Your course will be unlocked as soon as our team verifies the payment of{' '}
          <strong>{formatINR(amount)}</strong> in our bank records. You can check My Courses later; no further action is needed.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">Reference: {utr.replace(/\s+/g, '')}</p>
      </section>
    )
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-5" aria-label="Pay using UPI QR" data-testid="upi-qr-panel">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl">Pay using UPI QR</h2>
        <button type="button" onClick={onClose} className="min-h-11 text-sm font-semibold text-link underline-offset-4 hover:underline">
          Close
        </button>
      </div>
      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,16rem)_1fr]">
        <div>
          {/* the exact QR supplied by the client, shown unchanged */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/upi-qr.png" alt={`UPI QR code for ${payee}`} className="mx-auto w-full max-w-64 rounded-lg border border-border bg-white" />
        </div>
        <div className="space-y-3 text-sm">
          <p>
            <span className="text-muted-foreground">Payee:</span> <strong>{payee}</strong>
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">UPI ID:</span> <strong className="break-all">{upiId}</strong>
            <button type="button" onClick={copy} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold" aria-label="Copy UPI ID">
              <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy
            </button>
          </p>
          <p className="rounded-md bg-plum-50 px-3 py-2 text-plum-900">
            Amount to pay: <strong className="text-lg">{formatINR(amount)}</strong>. This QR does not carry an amount, so please
            enter exactly this amount in your UPI app.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Scan the QR with any UPI app (or pay to the UPI ID).</li>
            <li>Enter the exact amount shown above and complete the payment.</li>
            <li>Copy the 12-digit UTR / reference number from the payment receipt and submit it below.</li>
          </ol>
          <form onSubmit={submit} className="space-y-2 pt-1">
            <label htmlFor="utr" className="block text-sm font-semibold">UTR / reference number</label>
            <input
              id="utr"
              inputMode="numeric"
              autoComplete="off"
              maxLength={20}
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/[^\d\s]/g, ''))}
              placeholder="12-digit number"
              className="min-h-11 w-full rounded-md border border-border bg-background px-3"
              aria-invalid={!!error}
              aria-describedby={error ? 'utr-error' : undefined}
              required
            />
            {error ? <p id="utr-error" role="alert" className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy || utr.replace(/\s+/g, '').length !== 12}>
              {busy ? 'Submitting…' : 'Submit payment reference'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Your course is NOT unlocked by this step. Access is granted only after our team verifies the payment.
          </p>
        </div>
      </div>
    </section>
  )
}
