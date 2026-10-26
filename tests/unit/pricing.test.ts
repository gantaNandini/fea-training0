import { describe, expect, it } from 'vitest'
import {
  applyCoupon,
  computeGST,
  computeTotals,
  discountPercent,
  effectivePrice,
  exceedsOrderCap,
  formatDuration,
  formatHours,
  formatINR,
} from '@/lib/utils/pricing'

describe('formatINR', () => {
  it('uses Indian digit grouping', () => {
    expect(formatINR(10_000_000)).toBe('₹1,00,000')
    expect(formatINR(9_999_000)).toBe('₹99,990')
    expect(formatINR(500_000)).toBe('₹5,000')
    expect(formatINR(2_500_000)).toBe('₹25,000')
    expect(formatINR(123_456_700)).toBe('₹12,34,567')
  })
  it('shows paise only when non-zero', () => {
    expect(formatINR(100)).toBe('₹1')
    expect(formatINR(12_345)).toBe('₹123.45')
    expect(formatINR(0)).toBe('₹0')
  })
})

describe('formatDuration', () => {
  it('formats m:ss and h:mm:ss', () => {
    expect(formatDuration(59)).toBe('0:59')
    expect(formatDuration(600)).toBe('10:00')
    expect(formatDuration(3_600)).toBe('1:00:00')
    expect(formatDuration(3_725)).toBe('1:02:05')
  })
  it('returns empty string for 0 seconds (DOCUMENT lessons)', () => {
    expect(formatDuration(0)).toBe('')
  })
  it('formatHours is compact', () => {
    expect(formatHours(25_200)).toBe('7h 0m')
    expect(formatHours(17_280)).toBe('4h 48m')
    expect(formatHours(900)).toBe('15m')
  })
})

describe('effectivePrice / discountPercent', () => {
  it('prefers a lower discountPrice', () => {
    expect(effectivePrice(10_000, 8_000)).toBe(8_000)
    expect(effectivePrice(10_000, null)).toBe(10_000)
    expect(effectivePrice(10_000, 12_000)).toBe(10_000)
  })
  it('computes discount percent', () => {
    expect(discountPercent(10_000, 7_500)).toBe(25)
    expect(discountPercent(10_000, null)).toBe(0)
  })
})

describe('GST (paise, half-up)', () => {
  it('INCLUSIVE: total unchanged, gst extracted', () => {
    // 11800 paise incl 18% -> gst = 1800
    expect(computeGST(11_800, 18, 'INCLUSIVE')).toEqual({ gst: 1_800, total: 11_800 })
    // 2,500,000 * 18 / 118 = 381355.93 -> 381356
    expect(computeGST(2_500_000, 18, 'INCLUSIVE')).toEqual({ gst: 381_356, total: 2_500_000 })
  })
  it('EXCLUSIVE: gst added on top', () => {
    expect(computeGST(10_000, 18, 'EXCLUSIVE')).toEqual({ gst: 1_800, total: 11_800 })
    // 1 paisa * 18% = 0.18 -> rounds to 0
    expect(computeGST(1, 18, 'EXCLUSIVE')).toEqual({ gst: 0, total: 1 })
    // 3 paise * 18% = 0.54 -> rounds to 1
    expect(computeGST(3, 18, 'EXCLUSIVE')).toEqual({ gst: 1, total: 4 })
  })
  it('rounds .5 up', () => {
    // 50 paise * 1% = 0.5 -> 1
    expect(computeGST(50, 1, 'EXCLUSIVE').gst).toBe(1)
  })
  it('zero total has zero GST', () => {
    expect(computeGST(0, 18, 'INCLUSIVE')).toEqual({ gst: 0, total: 0 })
    expect(computeGST(0, 18, 'EXCLUSIVE')).toEqual({ gst: 0, total: 0 })
  })
})

describe('coupons', () => {
  it('PERCENT uses basis points', () => {
    expect(applyCoupon(2_500_000, { discountType: 'PERCENT', discountValue: 1_000 })).toBe(250_000)
    expect(applyCoupon(1_001, { discountType: 'PERCENT', discountValue: 1_000 })).toBe(100)
    expect(applyCoupon(1_005, { discountType: 'PERCENT', discountValue: 1_000 })).toBe(101) // 100.5 -> 101
  })
  it('FLAT is paise', () => {
    expect(applyCoupon(500_000, { discountType: 'FLAT', discountValue: 100_000 })).toBe(100_000)
  })
  it('discount larger than subtotal floors the total at 0', () => {
    expect(applyCoupon(50_000, { discountType: 'FLAT', discountValue: 100_000 })).toBe(50_000)
    const t = computeTotals({
      items: [{ price: 50_000 }],
      coupon: { discountType: 'FLAT', discountValue: 100_000 },
      gstPercent: 18,
      gstMode: 'EXCLUSIVE',
    })
    expect(t.total).toBe(0)
    expect(t.gst).toBe(0)
  })
  it('no coupon -> no discount', () => {
    expect(applyCoupon(10_000, null)).toBe(0)
  })
})

describe('computeTotals — order: discountPrice -> coupon -> GST', () => {
  it('stacks discountPrice and coupon, then applies GST on the post-discount amount (EXCLUSIVE)', () => {
    const t = computeTotals({
      items: [
        { price: 3_000_000, discountPrice: 2_500_000 }, // effective 25,000
        { price: 500_000 }, // 5,000
      ],
      coupon: { discountType: 'PERCENT', discountValue: 1_000 }, // 10%
      gstPercent: 18,
      gstMode: 'EXCLUSIVE',
    })
    expect(t.subtotal).toBe(3_000_000)
    expect(t.discount).toBe(300_000)
    expect(t.taxable).toBe(2_700_000)
    expect(t.gst).toBe(486_000)
    expect(t.total).toBe(3_186_000)
  })
  it('INCLUSIVE keeps total = taxable', () => {
    const t = computeTotals({
      items: [{ price: 11_800 }],
      coupon: null,
      gstPercent: 18,
      gstMode: 'INCLUSIVE',
    })
    expect(t.total).toBe(11_800)
    expect(t.gst).toBe(1_800)
  })
  it('total = 0 edge case (100% coupon)', () => {
    const t = computeTotals({
      items: [{ price: 500_000 }],
      coupon: { discountType: 'PERCENT', discountValue: 10_000 },
      gstPercent: 18,
      gstMode: 'INCLUSIVE',
    })
    expect(t).toMatchObject({ discount: 500_000, taxable: 0, gst: 0, total: 0 })
  })
  it('empty cart is all zeros', () => {
    const t = computeTotals({ items: [], gstPercent: 18, gstMode: 'INCLUSIVE' })
    expect(t.total).toBe(0)
  })
})

describe('order cap', () => {
  it('default cap is Rs 10,00,000', () => {
    expect(exceedsOrderCap(100_000_000)).toBe(false)
    expect(exceedsOrderCap(100_000_001)).toBe(true)
  })
  it('respects a custom cap', () => {
    expect(exceedsOrderCap(500, 400)).toBe(true)
  })
})
