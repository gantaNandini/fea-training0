'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { formatINR } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'
import type { OrderSummaryDTO } from '@/lib/types'

/**
 * REQ-144: polls GET /api/orders/{id}/status once a second for up to 15 s while PENDING, then falls
 * back to "Payment processing — check My Courses".
 */
export function OrderStatus({ order }: { order: OrderSummaryDTO }) {
  const [status, setStatus] = React.useState(order.status)
  const [gaveUp, setGaveUp] = React.useState(false)

  React.useEffect(() => {
    if (status !== 'PENDING') return
    let tries = 0
    const t = setInterval(async () => {
      tries++
      try {
        const res = await fetch(`/api/orders/${order.id}/status`, { cache: 'no-store' })
        if (res.ok) {
          const body = (await res.json()) as { status: OrderSummaryDTO['status'] }
          if (body.status !== 'PENDING') {
            setStatus(body.status)
            clearInterval(t)
            return
          }
        }
      } catch {
        /* keep polling */
      }
      if (tries >= 15) {
        clearInterval(t)
        setGaveUp(true)
      }
    }, 1000)
    return () => clearInterval(t)
  }, [order.id, status])

  if (status === 'COMPLETED') {
    return <Confirmed order={order} />
  }

  if (status === 'PENDING') {
    return (
      <div className="mx-auto max-w-xl text-center" role="status">
        <Loader className="mx-auto h-12 w-12 animate-spin text-plum-700 motion-reduce:animate-none" aria-hidden="true" />
        <h1 className="mt-4 text-3xl">{messages.checkout.pendingTitle}</h1>
        <p className="mt-2 text-muted-foreground">Confirming your payment and unlocking your course…</p>
        {gaveUp ? <p className="mt-2 text-muted-foreground">{messages.checkout.pendingBody}</p> : null}
        {gaveUp ? (
          <div className="mt-6">
            <ButtonLink href="/my-courses" size="lg">{messages.checkout.goToMyCourses}</ButtonLink>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl text-center" role="alert">
      <h1 className="text-3xl">{messages.errors.errorTitle}</h1>
      <p className="mt-2 text-muted-foreground">{messages.checkout.errorGeneric}</p>
      <div className="mt-6">
        <ButtonLink href="/cart" size="lg">{messages.cart.title}</ButtonLink>
      </div>
    </div>
  )
}

/** Paid and enrolled: access is already live. A single-course order opens the course after 4 s. */
function Confirmed({ order }: { order: OrderSummaryDTO }) {
  const router = useRouter()
  const first = order.items.find((i) => i.slug)
  const single = order.items.length === 1 && !!first?.slug
  const [seconds, setSeconds] = React.useState(single ? 4 : 0)

  React.useEffect(() => {
    if (!single || !first?.slug) return
    if (seconds <= 0) {
      router.push(`/learn/${first.slug}`)
      return
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, single, first?.slug, router])

  return (
      <div className="mx-auto max-w-xl text-center" data-testid="order-confirmed">
        <CheckCircle2 className="mx-auto h-16 w-16 text-success-text dark:text-green-400" aria-hidden="true" />
        <h1 className="mt-4 text-3xl">{messages.checkout.successTitle}</h1>
        <p className="mt-2 text-muted-foreground">{messages.checkout.successBody}</p>
        <p className="mt-1 text-muted-foreground">Your course access is active now — no approval needed.</p>
        <p className="mt-4 text-sm">
          {messages.checkout.orderNumber}: <strong data-testid="order-number">{order.orderNumber}</strong>
        </p>
        <ul className="mt-6 divide-y divide-border rounded-xl border border-border text-left">
          {order.items.map((i) => (
            <li key={i.courseId} className="flex items-center justify-between gap-4 p-4 text-sm">
              {i.slug ? (
                <Link href={`/courses/${i.slug}`} className="font-semibold text-link underline-offset-4 hover:underline">
                  {i.title}
                </Link>
              ) : (
                <span className="font-semibold">{i.title}</span>
              )}
              <span>{formatINR(i.price)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {first?.slug ? (
            <ButtonLink href={`/learn/${first.slug}`} size="lg" data-testid="start-learning">
              Start learning{single && seconds > 0 ? ` (opening in ${seconds}s)` : ''}
            </ButtonLink>
          ) : null}
          <ButtonLink href="/my-courses" variant="outline" size="lg">{messages.checkout.goToMyCourses}</ButtonLink>
          <ButtonLink href={`/orders/${order.id}/receipt`} variant="outline" size="lg">
            {messages.checkout.viewReceipt}
          </ButtonLink>
        </div>
      </div>
  )
}
