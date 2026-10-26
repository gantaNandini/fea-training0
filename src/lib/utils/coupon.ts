export type CouponProblem = 'INACTIVE' | 'EXPIRED' | 'EXHAUSTED'

export interface CouponState {
  active: boolean
  expiresAt: Date | null
  maxUses: number | null
  usedCount: number
}

/** Pure validity check; the same rules are enforced atomically in SQL at order creation. */
export function couponProblem(c: CouponState, now: Date = new Date()): CouponProblem | null {
  if (!c.active) return 'INACTIVE'
  if (c.expiresAt && c.expiresAt.getTime() <= now.getTime()) return 'EXPIRED'
  if (c.maxUses != null && c.usedCount >= c.maxUses) return 'EXHAUSTED'
  return null
}

export const couponProblemMessage: Record<CouponProblem, string> = {
  INACTIVE: 'This coupon is not active.',
  EXPIRED: 'This coupon has expired.',
  EXHAUSTED: 'This coupon has reached its usage limit.',
}
