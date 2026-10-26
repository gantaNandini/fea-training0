'use client'

import * as React from 'react'
import type { MeState } from '@/lib/types'

interface UserStateValue extends MeState {
  loaded: boolean
  authenticated: boolean
  refresh: () => Promise<void>
  setCartIds: (ids: string[]) => void
  setWishlistIds: (ids: string[]) => void
}

const Ctx = React.createContext<UserStateValue | null>(null)

const EMPTY: MeState = { wishlistIds: [], cartIds: [], enrolledIds: [], user: null }

/**
 * Per-user state (wishlist, cart, enrolments, header identity) comes from GET /api/me/state, once on
 * mount (REQ-032, REQ-280A). Cached public pages never contain per-user data.
 */
export function UserStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<MeState>(EMPTY)
  const [loaded, setLoaded] = React.useState(false)

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch('/api/me/state', { cache: 'no-store' })
      if (res.ok) setState((await res.json()) as MeState)
    } catch {
      /* offline: keep the empty state */
    } finally {
      setLoaded(true)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const value = React.useMemo<UserStateValue>(
    () => ({
      ...state,
      loaded,
      authenticated: !!state.user,
      refresh,
      setCartIds: (cartIds) => setState((s) => ({ ...s, cartIds })),
      setWishlistIds: (wishlistIds) => setState((s) => ({ ...s, wishlistIds })),
    }),
    [state, loaded, refresh],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUserStateContext(): UserStateValue {
  const v = React.useContext(Ctx)
  if (!v) throw new Error('useUserState must be used inside <UserStateProvider>')
  return v
}
