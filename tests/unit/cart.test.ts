import { describe, expect, it } from 'vitest'
import { addCourseId, mergeCartCourseIds, removeCourseId } from '@/lib/utils/cart'
import { couponProblem } from '@/lib/utils/coupon'
import { isOriginAllowed } from '@/lib/security/origin'
import { safeRedirect } from '@/lib/utils/redirect'

describe('cart helpers', () => {
  it('add is idempotent', () => {
    expect(addCourseId(['a'], 'b')).toEqual(['a', 'b'])
    expect(addCourseId(['a', 'b'], 'b')).toEqual(['a', 'b'])
  })
  it('remove drops the id', () => {
    expect(removeCourseId(['a', 'b'], 'a')).toEqual(['b'])
    expect(removeCourseId(['a'], 'zzz')).toEqual(['a'])
  })
  it('merge moves new courses and drops duplicates / enrolled courses', () => {
    const r = mergeCartCourseIds(['a', 'b', 'c', 'c'], ['b'], ['c'])
    expect(r.toMove).toEqual(['a'])
    expect(r.toDrop.sort()).toEqual(['b', 'c'])
  })
  it('merge is a no-op for an empty guest cart', () => {
    expect(mergeCartCourseIds([], ['a'], [])).toEqual({ toMove: [], toDrop: [] })
  })
})

describe('coupon validity', () => {
  const base = { active: true, expiresAt: null, maxUses: null, usedCount: 0 }
  it('valid coupon', () => expect(couponProblem(base)).toBeNull())
  it('inactive', () => expect(couponProblem({ ...base, active: false })).toBe('INACTIVE'))
  it('expired', () =>
    expect(couponProblem({ ...base, expiresAt: new Date(Date.now() - 1000) })).toBe('EXPIRED'))
  it('exhausted', () => expect(couponProblem({ ...base, maxUses: 5, usedCount: 5 })).toBe('EXHAUSTED'))
  it('not yet exhausted', () => expect(couponProblem({ ...base, maxUses: 5, usedCount: 4 })).toBeNull())
})

describe('Origin check (REQ-319)', () => {
  const host = 'localhost:3000'
  it('allows same-origin POST', () => {
    expect(
      isOriginAllowed({ method: 'POST', pathname: '/api/cart', origin: 'http://localhost:3000', host }),
    ).toBe(true)
  })
  it('rejects cross-origin POST', () => {
    expect(
      isOriginAllowed({ method: 'POST', pathname: '/api/cart', origin: 'https://evil.example', host }),
    ).toBe(false)
  })
  it('rejects POST with no Origin header', () => {
    expect(isOriginAllowed({ method: 'POST', pathname: '/api/cart', origin: null, host })).toBe(false)
  })
  it('webhook is exempt: POST without Origin succeeds', () => {
    expect(
      isOriginAllowed({ method: 'POST', pathname: '/api/payments/webhook', origin: null, host }),
    ).toBe(true)
  })
  it('GET is never checked', () => {
    expect(isOriginAllowed({ method: 'GET', pathname: '/api/courses', origin: null, host })).toBe(true)
  })
})

describe('safeRedirect (REQ-127)', () => {
  it('accepts relative paths', () => {
    expect(safeRedirect('/checkout')).toBe('/checkout')
    expect(safeRedirect('/courses?category=x')).toBe('/courses?category=x')
  })
  it('rejects protocol-relative, absolute and backslash URLs', () => {
    expect(safeRedirect('//evil.example')).toBe('/')
    expect(safeRedirect('https://evil.example')).toBe('/')
    expect(safeRedirect('/\\evil.example')).toBe('/')
    expect(safeRedirect('javascript:alert(1)')).toBe('/')
  })
  it('falls back when empty', () => {
    expect(safeRedirect(null)).toBe('/')
    expect(safeRedirect('', '/x')).toBe('/x')
  })
})
