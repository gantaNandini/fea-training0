'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CreditCard, Landmark, ShieldCheck, Wallet, Zap } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { PriceTag } from '@/components/shared/PriceTag'
import { OrderSummary } from '@/components/cart/OrderSummary'
import { CouponField } from '@/components/cart/CouponField'
import { useCartView } from '@/hooks/useCartView'
import { formatINR } from '@/lib/utils/pricing'
import { useUserState } from '@/hooks/useUserState'
import { messages } from '@/lib/messages'
import { PAY_OPTIONS, checkoutConfig, type PayChoice } from '@/lib/payments/methods'
import { cn } from '@/lib/utils/cn'

const ICONS: Record<PayChoice, typeof CreditCard> = { razorpay: Zap, debit: CreditCard, credit: CreditCard, netbanking: Landmark, wallet: Wallet }

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void }
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

type CreateOrderResponse =
  | { free: true; orderId: string }
  | {
      free: false
      orderId: string
      razorpayOrderId: string
      amount: number
      key: string
      provider: 'razorpay' | 'mock'
      hideMethods?: { method: string }[]
      mock?: { paymentId: string; signature: string }
    }

/** Checkout (REQ-140..142). Free totals skip the gateway; the mock provider completes instantly. */
export function CheckoutView({ initialCoupon, tiles = ['razorpay'] }: { initialCoupon: string | null; tiles?: PayChoice[] }) {
  const router = useRouter()
  const { user } = useUserState()
  const { data, loading, setCoupon, validCoupon, couponError } = useCartView(initialCoupon)
  const [busy, setBusy] = React.useState(false)
  const [choice, setChoice] = React.useState<PayChoice | null>(null)

  const goSuccess = (orderId: string) => router.push(`/checkout/success?orderId=${encodeURIComponent(orderId)}`)

  async function verify(orderId: string, r: RazorpayResponse) {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        razorpayOrderId: r.razorpay_order_id,
        razorpayPaymentId: r.razorpay_payment_id,
        razorpaySignature: r.razorpay_signature,
      }),
    })
    // REQ-142A: 409 ALREADY_PROCESSED is a success
    if (res.ok || res.status === 409) return goSuccess(orderId)
    // The money may already have left the account (server hiccup / network): never strand the buyer on
    // an error. The confirmation page keeps checking with the gateway and enrols automatically.
    if (res.status >= 500) return goSuccess(orderId)
    toast.error(messages.checkout.errorGeneric)
    setBusy(false)
  }

  async function pay(selected: PayChoice = 'razorpay') {
    setChoice(selected)
    setBusy(true)
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: validCoupon }),
      })
      if (res.status === 401) {
        router.push('/login?redirect=/checkout')
        return
      }
      const body = (await res.json()) as CreateOrderResponse & { error?: { message?: string } }
      if (!res.ok) {
        toast.error(body.error?.message ?? messages.checkout.errorGeneric)
        setBusy(false)
        return
      }
      if (body.free) return goSuccess(body.orderId)

      if (body.provider === 'mock' && body.mock) {
        return void verify(body.orderId, {
          razorpay_order_id: body.razorpayOrderId,
          razorpay_payment_id: body.mock.paymentId,
          razorpay_signature: body.mock.signature,
        })
      }

      if (!(await loadRazorpay()) || !window.Razorpay) {
        toast.error(messages.checkout.loadingScript)
        setBusy(false)
        return
      }
      const rz = new window.Razorpay({
        key: body.key,
        amount: body.amount,
        currency: 'INR',
        name: 'PYTHAGORAS',
        order_id: body.razorpayOrderId,
        prefill: { name: user?.name ?? '' },
        // the chosen category restricts what the Razorpay window shows; the server verifies every payment
        ...(checkoutConfig(selected) ? { config: checkoutConfig(selected) } : {}),
        theme: { color: '#123A78' },
        handler: (r: RazorpayResponse) => void verify(body.orderId, r),
        modal: {
          ondismiss: () => {
            toast.message(messages.checkout.cancelled)
            setBusy(false)
          },
        },
      })
      rz.on('payment.failed', () => {
        toast.error(messages.checkout.errorGeneric)
        setBusy(false)
      })
      rz.open()
    } catch {
      toast.error(messages.errors.network)
      setBusy(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]" role="status" aria-label={messages.common.loading}>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title={messages.checkout.cartEmpty}
        action={<ButtonLink href="/courses">{messages.cart.keepShopping}</ButtonLink>}
      />
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <section aria-label={messages.checkout.summary}>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {data.items.map((c) => (
            <li key={c.id} className="flex items-center gap-4 p-4">
              <div className="relative aspect-card w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                <PlaceholderArt src={c.thumbnail} alt={c.title} fill sizes="96px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-display font-bold">{c.title}</p>
                <p className="truncate text-sm text-muted-foreground">{c.instructorName}</p>
              </div>
              <PriceTag price={c.price} discountPrice={c.discountPrice} isFree={c.isFree} />
            </li>
          ))}
        </ul>
      </section>
      <aside className="h-fit space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="text-xl">{messages.checkout.summary}</h2>
        <CouponField applied={validCoupon} error={couponError} onApply={setCoupon} onRemove={() => setCoupon(null)} />
        <OrderSummary totals={data.totals} couponCode={validCoupon} />
        {data.totals.total === 0 ? (
          <Button size="lg" className="w-full" onClick={() => pay('razorpay')} disabled={busy} data-testid="pay-now">
            {busy ? messages.checkout.processing : messages.checkout.payNow}
          </Button>
        ) : (
          <div role="group" aria-label="Choose how to pay" className="space-y-3">
            <h3 className="text-base font-semibold">Choose how to pay</h3>
            <ul className="grid grid-cols-1 gap-2.5">
              {PAY_OPTIONS.filter((o) => tiles.includes(o.id)).map((o) => {
                const Icon = ICONS[o.id]
                const active = busy && choice === o.id
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => pay(o.id)}
                      disabled={busy}
                      data-testid={o.id === 'razorpay' ? 'pay-now' : `pay-${o.id}`}
                      aria-label={`Pay ${formatINR(data.totals.total)} with ${o.label}`}
                      className={cn(
                        'flex min-h-14 w-full items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 text-left transition-colors',
                        'hover:border-plum-600 hover:bg-plum-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plum-600',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                        active ? 'border-plum-600 ring-2 ring-plum-600/30' : 'border-border',
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-plum-50 text-plum-700">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{active ? messages.checkout.processing : o.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>
                        {o.badges ? (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {o.badges.map((b) => (
                              <span key={b} className="rounded border border-border px-1.5 text-[10px] font-medium leading-4 text-muted-foreground">{b}</span>
                            ))}
                          </span>
                        ) : null}
                      </span>
                      <span aria-hidden="true" className="text-plum-700">›</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          {messages.checkout.secure}
        </p>
      </aside>
    </div>
  )
}
