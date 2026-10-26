import { describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { OrderError, completeOrder } from '@/lib/orders/complete-order'
import { createOrderForUser, CreateOrderError } from '@/lib/orders/create-order'
import { addCartItem } from '@/lib/data/cart'
import { makeCourse, makePendingOrder, makeUser } from './factories'
import { POST as webhook } from '@/app/api/payments/webhook/route'

async function setup(count = 1) {
  const teacher = await makeUser({ role: 'INSTRUCTOR' })
  const user = await makeUser()
  const courses = await Promise.all(Array.from({ length: count }, () => makeCourse({ instructorId: teacher.id, lessons: [60] })))
  const order = await makePendingOrder({ userId: user.id, courseIds: courses.map((c) => c.id) })
  const details = (paymentId = 'pay_1') => ({
    razorpayOrderId: order.razorpayOrderId!,
    razorpayPaymentId: paymentId,
    amount: order.total,
  })
  return { user, courses, order, details }
}

describe('completeOrder (REQ-143, REQ-322)', () => {
  it('is idempotent for the same payment', async () => {
    const { order, details } = await setup()
    const a = await completeOrder(order.id, details())
    const b = await completeOrder(order.id, details())
    expect(a.alreadyProcessed).toBe(false)
    expect(b.alreadyProcessed).toBe(true)
    expect(await db.payment.count()).toBe(1)
  })

  it('5 parallel calls produce exactly one Payment and one Enrollment per course', async () => {
    const { order, details, courses } = await setup(2)
    await Promise.all(Array.from({ length: 5 }, () => completeOrder(order.id, details())))
    expect(await db.payment.count()).toBe(1)
    expect(await db.enrollment.count()).toBe(courses.length)
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('COMPLETED')
  })

  it('amount mismatch leaves the order PENDING', async () => {
    const { order, details } = await setup()
    await expect(completeOrder(order.id, { ...details(), amount: order.total - 1 })).rejects.toMatchObject({ code: 'AMOUNT_MISMATCH' })
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('PENDING')
    expect(await db.enrollment.count()).toBe(0)
  })

  it('Razorpay order id mismatch is rejected', async () => {
    const { order, details } = await setup()
    await expect(completeOrder(order.id, { ...details(), razorpayOrderId: 'order_other' })).rejects.toBeInstanceOf(OrderError)
  })

  it('zero-total orders enrol without a Payment row', async () => {
    const teacher = await makeUser({ role: 'INSTRUCTOR' })
    const user = await makeUser()
    const course = await makeCourse({ instructorId: teacher.id })
    const order = await makePendingOrder({ userId: user.id, courseIds: [course.id], price: 0, total: 0 })
    await completeOrder(order.id)
    expect(await db.payment.count()).toBe(0)
    expect(await db.enrollment.count()).toBe(1)
  })

  it('a FAILED order accepts a late payment.captured and becomes COMPLETED', async () => {
    const teacher = await makeUser({ role: 'INSTRUCTOR' })
    const user = await makeUser()
    const course = await makeCourse({ instructorId: teacher.id })
    const order = await makePendingOrder({ userId: user.id, courseIds: [course.id], status: 'FAILED' })
    await completeOrder(order.id, { razorpayOrderId: order.razorpayOrderId!, razorpayPaymentId: 'pay_late', amount: order.total })
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('COMPLETED')
  })
})

describe('createOrderForUser', () => {
  it('rejects an exhausted coupon', async () => {
    const teacher = await makeUser({ role: 'INSTRUCTOR' })
    const user = await makeUser()
    const course = await makeCourse({ instructorId: teacher.id })
    await db.coupon.create({ data: { code: 'USEDUP', discountType: 'PERCENT', discountValue: 1000, maxUses: 1, usedCount: 1 } })
    await addCartItem({ userId: user.id }, course.id)
    await expect(createOrderForUser(user, 'USEDUP')).rejects.toBeInstanceOf(CreateOrderError)
  })
})

describe('webhook (REQ-143A)', () => {
  it('accepts a correctly signed POST with no Origin header and completes the order', async () => {
    const { order, details } = await setup()
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_wh', order_id: order.razorpayOrderId, amount: details().amount, method: 'card' } } },
    })
    const { createHmac } = await import('node:crypto')
    const sig = createHmac('sha256', `mock:${process.env.NEXTAUTH_SECRET}`).update(body).digest('hex')
    const res = await webhook(new Request('http://localhost/api/payments/webhook', { method: 'POST', body, headers: { 'x-razorpay-signature': sig } }))
    expect(res.status).toBe(200)
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('COMPLETED')
  })

  it('rejects a bad signature with 400', async () => {
    const res = await webhook(new Request('http://localhost/api/payments/webhook', { method: 'POST', body: '{}', headers: { 'x-razorpay-signature': 'nope' } }))
    expect(res.status).toBe(400)
  })
})

