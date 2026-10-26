import type { CartResponse } from '@/lib/types'
import { formatINR } from '@/lib/utils/pricing'
import { messages } from '@/lib/messages'

/** Subtotal / coupon / GST / total — all numbers come from the server (pricing.ts). REQ-131/132. */
export function OrderSummary({ totals, couponCode }: { totals: CartResponse['totals']; couponCode?: string | null }) {
  const inclusive = totals.gstMode === 'INCLUSIVE'
  return (
    <dl className="space-y-3 text-sm" data-testid="order-summary">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">{messages.cart.subtotal}</dt>
        <dd className="font-medium">{formatINR(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 ? (
        <div className="flex justify-between text-success-text dark:text-green-400">
          <dt>
            {messages.cart.discount}
            {couponCode ? ` (${couponCode})` : ''}
          </dt>
          <dd className="font-medium">−{formatINR(totals.discount)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between">
        <dt className="text-muted-foreground">
          {inclusive ? messages.cart.includesGst : messages.cart.gst} ({totals.gstPercent}%)
        </dt>
        <dd className="font-medium">{formatINR(totals.gst)}</dd>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-base">
        <dt className="font-bold">{messages.cart.total}</dt>
        <dd className="font-display text-xl font-bold" data-testid="order-total">
          {formatINR(totals.total)}
        </dd>
      </div>
    </dl>
  )
}
