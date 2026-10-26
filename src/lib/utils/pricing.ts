/**
 * All price arithmetic lives here (REQ-009).
 *
 * - Money is integer paise. `type Paise = number`. No BigInt anywhere.
 * - Rounding is half-up to the nearest paisa, done with integer maths (no float drift).
 * - Evaluation order: discountPrice -> coupon -> GST (GST is applied on the post-discount amount).
 * - Int32 max is 2,147,483,647 paise (about Rs 2.14 crore). The *business* cap on an order is the
 *   SiteSetting `max_order_paise` (default 100,000,000 = Rs 10,00,000). It is enforced in
 *   create-order via `exceedsOrderCap`, not derived from the column type.
 */

export type Paise = number
export type GstMode = 'INCLUSIVE' | 'EXCLUSIVE'
export type DiscountType = 'PERCENT' | 'FLAT'

export const DEFAULT_MAX_ORDER_PAISE: Paise = 100_000_000

export interface CouponLike {
  discountType: DiscountType
  /** paise for FLAT, basis points for PERCENT (1000 = 10%) */
  discountValue: number
}

/** Integer division rounded half-up (for non-negative n, positive d). */
export function divRound(n: number, d: number): number {
  return Math.floor((2 * n + d) / (2 * d))
}

export function effectivePrice(price: Paise, discountPrice?: Paise | null): Paise {
  return discountPrice != null && discountPrice < price ? discountPrice : price
}

export function discountPercent(price: Paise, discountPrice?: Paise | null): number {
  if (discountPrice == null || discountPrice >= price || price <= 0) return 0
  return Math.round(((price - discountPrice) / price) * 100)
}

/** Returns the discount amount in paise (never more than the amount, never negative). */
export function applyCoupon(amount: Paise, coupon?: CouponLike | null): Paise {
  if (!coupon || amount <= 0) return 0
  const raw =
    coupon.discountType === 'PERCENT'
      ? divRound(amount * coupon.discountValue, 10_000)
      : coupon.discountValue
  return Math.max(0, Math.min(raw, amount))
}

export function computeGST(
  taxable: Paise,
  gstPercent: number,
  mode: GstMode,
): { gst: Paise; total: Paise } {
  const amount = Math.max(0, taxable)
  const bp = Math.round(gstPercent * 100)
  if (amount === 0 || bp <= 0) return { gst: 0, total: amount }
  if (mode === 'INCLUSIVE') {
    // The listed price already contains GST: gst = amount * p / (100 + p)
    return { gst: divRound(amount * bp, 10_000 + bp), total: amount }
  }
  const gst = divRound(amount * bp, 10_000)
  return { gst, total: amount + gst }
}

export interface TotalsInput {
  items: { price: Paise; discountPrice?: Paise | null }[]
  coupon?: CouponLike | null
  gstPercent: number
  gstMode: GstMode
}

export interface Totals {
  subtotal: Paise
  discount: Paise
  taxable: Paise
  gst: Paise
  total: Paise
  gstMode: GstMode
  gstPercent: number
}

export function computeTotals({ items, coupon, gstPercent, gstMode }: TotalsInput): Totals {
  const subtotal = items.reduce((sum, i) => sum + effectivePrice(i.price, i.discountPrice), 0)
  const discount = applyCoupon(subtotal, coupon)
  const taxable = subtotal - discount
  const { gst, total } = computeGST(taxable, gstPercent, gstMode)
  return { subtotal, discount, taxable, gst, total, gstMode, gstPercent }
}

export function exceedsOrderCap(total: Paise, cap: Paise = DEFAULT_MAX_ORDER_PAISE): boolean {
  return total > cap
}

/** Indian digit grouping: 10000000 paise -> "₹1,00,000". Paise shown only when non-zero. */
export function formatINR(paise: Paise): string {
  const negative = paise < 0
  const abs = Math.abs(Math.trunc(paise))
  const rupees = Math.floor(abs / 100)
  const rem = abs % 100
  let s = String(rupees)
  if (s.length > 3) {
    const last3 = s.slice(-3)
    const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')
    s = `${rest},${last3}`
  }
  const decimals = rem !== 0 ? `.${String(rem).padStart(2, '0')}` : ''
  return `${negative ? '-' : ''}₹${s}${decimals}`
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** "m:ss" or "h:mm:ss". Returns "" for 0 seconds (DOCUMENT lessons show no badge). */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  if (s === 0) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${pad2(m)}:${pad2(sec)}` : `${m}:${pad2(sec)}`
}

/** Compact "7h 0m" / "48m" style used on cards. */
export function formatHours(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}
