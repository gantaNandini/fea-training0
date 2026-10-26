'use client'

import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { PriceTag } from '@/components/shared/PriceTag'
import { EmptyState } from '@/components/shared/EmptyState'
import { OrderSummary } from './OrderSummary'
import { CouponField } from './CouponField'
import { useCart } from '@/hooks/useCart'
import { useCartView } from '@/hooks/useCartView'
import { messages } from '@/lib/messages'

/** Cart page (REQ-131..135): optimistic removal with server persistence. */
export function CartView() {
  const { data, loading, setCoupon, validCoupon, couponError } = useCartView(null)
  const cart = useCart()

  if (loading && !data) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]" role="status" aria-label={messages.common.loading}>
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const items = (data?.items ?? []).filter((i) => cart.cartIds.includes(i.id))
  if (!data || items.length === 0) {
    return (
      <EmptyState
        title={messages.cart.empty}
        action={<ButtonLink href="/courses">{messages.cart.keepShopping}</ButtonLink>}
      />
    )
  }

  const checkoutHref = validCoupon ? `/checkout?coupon=${encodeURIComponent(validCoupon)}` : '/checkout'

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section aria-label={messages.cart.title}>
        <p className="mb-3 text-sm text-muted-foreground" data-testid="cart-count">
          {items.length} {items.length === 1 ? messages.cart.item : messages.cart.items}
        </p>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {items.map((c) => (
            <li key={c.id} className="flex gap-4 p-4" data-testid="cart-item">
              <div className="relative aspect-card w-28 shrink-0 self-start overflow-hidden rounded-md bg-muted sm:w-40">
                <PlaceholderArt src={c.thumbnail} alt={c.title} fill sizes="160px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/courses/${c.slug}`} className="line-clamp-2 font-display font-bold hover:text-link">
                  {c.title}
                </Link>
                <p className="mt-1 truncate text-sm text-muted-foreground">{c.instructorName}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <PriceTag price={c.price} discountPrice={c.discountPrice} isFree={c.isFree} />
                  <button
                    type="button"
                    onClick={() => cart.remove(c.id)}
                    aria-label={`${messages.cart.removeItem}: ${c.title}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-semibold text-link hover:bg-muted"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {messages.common.remove}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="h-fit space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24" aria-label={messages.checkout.summary}>
        <CouponField
          applied={validCoupon}
          error={couponError}
          onApply={(code) => setCoupon(code)}
          onRemove={() => setCoupon(null)}
        />
        <OrderSummary totals={data.totals} couponCode={validCoupon} />
        <ButtonLink href={checkoutHref} size="lg" className="w-full" data-testid="proceed-checkout">
          {messages.cart.proceed}
        </ButtonLink>
      </aside>
    </div>
  )
}
