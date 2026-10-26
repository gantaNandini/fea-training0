'use client'

import * as React from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ButtonLink } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PlaceholderArt } from '@/components/shared/PlaceholderArt'
import { useCart } from '@/hooks/useCart'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { effectivePrice, formatINR } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'
import type { CartResponse } from '@/lib/types'

/** Cart icon + badge; dropdown opens on hover (desktop) / click (touch) — REQ-035. */
export function MiniCart() {
  const { count, cartIds } = useCart()
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<CartResponse | null>(null)
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setData(null)
    fetch('/api/cart', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setData(d as CartResponse | null))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [open, cartIds.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const enter = () => {
    if (!canHover) return
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const leave = () => {
    if (!canHover) return
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div onMouseEnter={enter} onMouseLeave={leave} className="relative">
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`${messages.nav.cart}${count ? `, ${count} ${count === 1 ? messages.cart.item : messages.cart.items}` : ''}`}
              data-testid="cart-button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {count > 0 ? (
                <span
                  data-testid="cart-badge"
                  className="absolute right-0.5 top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-600 px-1 text-xs font-bold text-white"
                >
                  {count}
                </span>
              ) : null}
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent align="end" className="w-80" onMouseEnter={enter} onMouseLeave={leave}>
        <p className="mb-3 font-display font-bold">{messages.cart.miniCartTitle}</p>
        {count === 0 ? (
          <div className="py-4 text-center">
            <p className="mb-3 text-sm text-muted-foreground">{messages.cart.empty}</p>
            <Link href="/courses" onClick={() => setOpen(false)} className="font-semibold text-link underline-offset-4 hover:underline">
              {messages.cart.keepShopping}
            </Link>
          </div>
        ) : !data ? (
          <div className="space-y-3" role="status" aria-label={messages.common.loading}>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            <ul className="max-h-64 space-y-3 overflow-y-auto">
              {data.items.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <div className="relative aspect-card w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    <PlaceholderArt src={c.thumbnail} alt={c.title} fill sizes="80px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold">{c.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.isFree ? messages.course.free : formatINR(effectivePrice(c.price, c.discountPrice))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">{messages.cart.subtotal}</span>
              <span className="font-bold">{formatINR(data.totals.subtotal)}</span>
            </div>
            <ButtonLink href="/cart" className="mt-3 w-full" onClick={() => setOpen(false)}>
              {messages.course.goToCart}
            </ButtonLink>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
