'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useUserState } from './useUserState'
import { addCourseId, removeCourseId } from '@/lib/utils/cart'
import { messages } from '@/lib/messages'

async function call(method: 'POST' | 'DELETE', courseId: string) {
  const res = await fetch('/api/cart', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId }),
  })
  const body = (await res.json().catch(() => ({}))) as {
    cartIds?: string[]
    error?: { message?: string }
  }
  return { ok: res.ok, body }
}

/** Optimistic cart mutations with server persistence (REQ-135). */
export function useCart() {
  const { cartIds, setCartIds, enrolledIds } = useUserState()
  const [pending, setPending] = React.useState<string | null>(null)

  const add = React.useCallback(
    async (courseId: string): Promise<boolean> => {
      if (enrolledIds.includes(courseId)) {
        toast.error(messages.cart.alreadyEnrolled) // REQ-134
        return false
      }
      const before = cartIds
      setCartIds(addCourseId(before, courseId))
      setPending(courseId)
      const { ok, body } = await call('POST', courseId)
      setPending(null)
      if (!ok) {
        setCartIds(before)
        toast.error(body.error?.message ?? messages.common.somethingWrong)
        return false
      }
      if (body.cartIds) setCartIds(body.cartIds)
      toast.success(messages.cart.added)
      return true
    },
    [cartIds, enrolledIds, setCartIds],
  )

  const remove = React.useCallback(
    async (courseId: string): Promise<boolean> => {
      const before = cartIds
      setCartIds(removeCourseId(before, courseId))
      const { ok, body } = await call('DELETE', courseId)
      if (!ok) {
        setCartIds(before)
        toast.error(body.error?.message ?? messages.common.somethingWrong)
        return false
      }
      if (body.cartIds) setCartIds(body.cartIds)
      return true
    },
    [cartIds, setCartIds],
  )

  return { cartIds, count: cartIds.length, has: (id: string) => cartIds.includes(id), add, remove, pending }
}
