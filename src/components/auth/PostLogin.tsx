'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useUserState } from '@/hooks/useUserState'
import { Skeleton } from '@/components/ui/skeleton'
import { messages } from '@/lib/messages'

/**
 * REQ-125: runs once after each sign-in (credentials or Google). Calls the idempotent
 * POST /api/cart/merge — the HttpOnly cart_session cookie is invisible to the client, so it always
 * calls — then refreshes the user state and goes to the validated redirect.
 */
export function PostLogin({ redirect }: { redirect: string }) {
  const router = useRouter()
  const { refresh } = useUserState()
  const ran = React.useRef(false)

  React.useEffect(() => {
    if (ran.current) return
    ran.current = true
    ;(async () => {
      try {
        const res = await fetch('/api/cart/merge', { method: 'POST' })
        if (res.status === 401) {
          router.replace('/login')
          return
        }
      } catch {
        /* merge is best-effort; continue */
      }
      await refresh()
      // Admins go straight to the dashboard; everyone else goes to the validated redirect.
      const state = await fetch('/api/me/state', { cache: 'no-store' }).then((r) => r.json())
      if (state?.user?.role === 'ADMIN') {
        router.replace('/admin/dashboard')
      } else {
        router.replace(redirect)
      }
    })()
  }, [redirect, refresh, router])

  return (
    <div className="container-page flex justify-center py-24" role="status">
      <div className="w-full max-w-sm space-y-3 text-center">
        <p className="font-semibold">{messages.auth.signingIn}</p>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mx-auto h-3 w-2/3" />
      </div>
    </div>
  )
}
