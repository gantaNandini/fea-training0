import { describe, expect, it } from 'vitest'
import { CreateOrderError, courseHasNoLessons, cartFingerprint } from '@/lib/orders/create-order'

// ---------------------------------------------------------------------------
// CreateOrderError
// ---------------------------------------------------------------------------

describe('CreateOrderError', () => {
  it('carries the error code on .code', () => {
    const err = new CreateOrderError('COURSE_COMING_SOON', 'This course is coming soon.')
    expect(err.code).toBe('COURSE_COMING_SOON')
    expect(err.message).toBe('This course is coming soon.')
    expect(err).toBeInstanceOf(Error)
  })

  it('is an instance of Error so callers can catch it generically', () => {
    expect(new CreateOrderError('CART_EMPTY', 'msg')).toBeInstanceOf(Error)
  })
})

// ---------------------------------------------------------------------------
// courseHasNoLessons — the guard that rejects COURSE_COMING_SOON orders
// ---------------------------------------------------------------------------

describe('courseHasNoLessons', () => {
  it('returns true when all sections have zero lessons', () => {
    expect(
      courseHasNoLessons({ sections: [{ _count: { lessons: 0 } }, { _count: { lessons: 0 } }] }),
    ).toBe(true)
  })

  it('returns true when there are no sections at all', () => {
    expect(courseHasNoLessons({ sections: [] })).toBe(true)
  })

  it('returns false when at least one section has a lesson', () => {
    expect(
      courseHasNoLessons({ sections: [{ _count: { lessons: 0 } }, { _count: { lessons: 3 } }] }),
    ).toBe(false)
  })

  it('returns false when every section has lessons', () => {
    expect(
      courseHasNoLessons({ sections: [{ _count: { lessons: 2 } }, { _count: { lessons: 5 } }] }),
    ).toBe(false)
  })

  it('handles a single section with one lesson', () => {
    expect(courseHasNoLessons({ sections: [{ _count: { lessons: 1 } }] })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// cartFingerprint — deterministic hash used for order idempotency
// ---------------------------------------------------------------------------

describe('cartFingerprint', () => {
  it('is deterministic for the same inputs', () => {
    const a = cartFingerprint([{ courseId: 'c1', price: 9900 }], 'WELCOME10')
    const b = cartFingerprint([{ courseId: 'c1', price: 9900 }], 'WELCOME10')
    expect(a).toBe(b)
  })

  it('is order-independent (sorts by courseId)', () => {
    const a = cartFingerprint(
      [{ courseId: 'c2', price: 5000 }, { courseId: 'c1', price: 9900 }],
      null,
    )
    const b = cartFingerprint(
      [{ courseId: 'c1', price: 9900 }, { courseId: 'c2', price: 5000 }],
      null,
    )
    expect(a).toBe(b)
  })

  it('differs when the coupon changes', () => {
    const a = cartFingerprint([{ courseId: 'c1', price: 9900 }], 'FLAT1000')
    const b = cartFingerprint([{ courseId: 'c1', price: 9900 }], null)
    expect(a).not.toBe(b)
  })

  it('differs when the price changes', () => {
    const a = cartFingerprint([{ courseId: 'c1', price: 9900 }], null)
    const b = cartFingerprint([{ courseId: 'c1', price: 8800 }], null)
    expect(a).not.toBe(b)
  })

  it('returns a 64-char hex string (SHA-256)', () => {
    const fp = cartFingerprint([{ courseId: 'c1', price: 100 }], null)
    expect(fp).toMatch(/^[0-9a-f]{64}$/)
  })
})
