import { NextResponse } from 'next/server'
import type { ZodTypeAny, z } from 'zod'

const NO_STORE = { 'Cache-Control': 'no-store' }

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: { ...NO_STORE, ...(init?.headers ?? {}) },
  })
}

export function fail(
  code: string,
  message: string,
  status: number,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { ...NO_STORE, ...(headers ?? {}) } },
  )
}

export const unauthenticated = () => fail('UNAUTHENTICATED', 'Please log in to continue.', 401)
export const forbidden = (message = 'You do not have access to this resource.') =>
  fail('FORBIDDEN', message, 403)
export const notFound = (message = 'Not found.') => fail('NOT_FOUND', message, 404)
export const tooMany = (retryAfterSeconds: number) =>
  fail('RATE_LIMITED', 'Too many attempts. Please try again later.', 429, {
    'Retry-After': String(Math.max(1, Math.ceil(retryAfterSeconds))),
  })

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

/** Parse + validate a JSON body with Zod (REQ-008 / REQ-314). */
export async function parseBody<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<{ data: z.infer<S>; error?: undefined } | { data?: undefined; error: NextResponse }> {
  const raw = await readJson(req)
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { error: fail('VALIDATION_ERROR', first?.message ?? 'Invalid input.', 400) }
  }
  return { data: parsed.data }
}

export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret || secret === 'change-me') return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}
