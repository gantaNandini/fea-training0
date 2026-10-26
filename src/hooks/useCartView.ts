'use client'

import * as React from 'react'
import type { CartResponse } from '@/lib/types'
import { useUserState } from './useUserState'

export type CartView = CartResponse & { cartIds: string[] }

/** Loads the server-computed cart (items + totals + coupon validity) and reloads on change. */
export function useCartView(initialCoupon: string | null) {
  const { cartIds } = useUserState()
  const [coupon, setCoupon] = React.useState<string | null>(initialCoupon)
  const [data, setData] = React.useState<CartView | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    const qs = coupon ? `?coupon=${encodeURIComponent(coupon)}` : ''
    fetch(`/api/cart${qs}`, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<CartView>) : null))
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setLoading(false)
        }
      })
      .catch(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [coupon, cartIds.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const validCoupon = data?.coupon?.valid ? data.coupon.code : null
  const couponError = data?.coupon && !data.coupon.valid ? (data.coupon.message ?? 'Invalid coupon') : null
  return { data, loading, coupon, setCoupon, validCoupon, couponError }
}
