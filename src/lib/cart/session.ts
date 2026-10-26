import { cookies } from 'next/headers'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

export const CART_COOKIE = 'cart_session'
const MAX_AGE = 30 * 24 * 60 * 60

function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? 'dev-secret'
}

function sign(id: string): string {
  return createHmac('sha256', secret()).update(id).digest('base64url')
}

export function encodeSession(id: string): string {
  return `${id}.${sign(id)}`
}

/** Returns the session id when the signature is valid, else null (REQ-130). */
export function decodeSession(value: string | undefined | null): string | null {
  if (!value) return null
  const dot = value.lastIndexOf('.')
  if (dot <= 0) return null
  const id = value.slice(0, dot)
  const sig = value.slice(dot + 1)
  const expected = Buffer.from(sign(id))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  return id
}

export async function readCartSessionId(): Promise<string | null> {
  const jar = await cookies()
  return decodeSession(jar.get(CART_COOKIE)?.value)
}

/** Route handlers only: creates the signed cookie when missing. */
export async function ensureCartSessionId(): Promise<string> {
  const existing = await readCartSessionId()
  if (existing) return existing
  const id = randomBytes(18).toString('base64url')
  const jar = await cookies()
  jar.set(CART_COOKIE, encodeSession(id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
  return id
}

export async function clearCartSession(): Promise<void> {
  const jar = await cookies()
  jar.set(CART_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}
