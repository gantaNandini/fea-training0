import { getFreshUser } from '@/lib/auth/guards'

export type ActionResult<T = object> = ({ ok: true; message?: string } & T) | { ok: false; error: string }

/** Every admin server action starts with this: re-checks the role in the DB (sessionVersion aware). */
export async function assertAdmin() {
  const user = await getFreshUser()
  if (!user || user.role !== 'ADMIN') throw new Error('FORBIDDEN')
  return user
}

export function errorResult(e: unknown): { ok: false; error: string } {
  if (e instanceof Error && e.message === 'FORBIDDEN') return { ok: false, error: 'You are not allowed to do this.' }
  console.error('[admin action]', e)
  return { ok: false, error: 'Something went wrong. Please try again.' }
}
