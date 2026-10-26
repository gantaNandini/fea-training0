import { auth } from './auth'
import { getAuthState, type AuthState } from '@/lib/data/users'

/** JWT-only identity (cheap). Do NOT use for sensitive actions. */
export async function getSessionUser() {
  const session = await auth()
  return session?.user?.id ? session.user : null
}

/**
 * Fresh identity for sensitive actions (REQ-121A): re-reads the user from the DB and rejects the
 * request when the JWT's sessionVersion no longer matches (password changed / reset elsewhere).
 */
export async function getFreshUser(): Promise<AuthState | null> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return null
  const fresh = await getAuthState(id)
  if (!fresh) return null
  if (fresh.sessionVersion !== session.user.sv) return null
  return fresh
}
