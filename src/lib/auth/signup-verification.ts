import { createHmac, randomInt } from 'crypto'
import { db } from '@/lib/db'
import { safeEqualHex } from '@/lib/payments/signature'

/**
 * Email-code check for new student sign-ups. The account is created only after the correct code is
 * entered; until then the details wait in `SignupVerification`. Only an HMAC of the code is stored.
 */
export const CODE_TTL_MS = 10 * 60 * 1000
export const RESEND_COOLDOWN_MS = 60 * 1000
export const MAX_ATTEMPTS = 5

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? 'dev-only-secret'
}

export function hashCode(email: string, code: string): string {
  return createHmac('sha256', secret()).update(`${email.trim().toLowerCase()}:${code}`).digest('hex')
}

export function codeMatches(email: string, code: string, codeHash: string): boolean {
  return safeEqualHex(hashCode(email, code), codeHash)
}

export function verificationEmail(name: string, code: string) {
  return {
    subject: 'Your PYTHAGORAS verification code',
    text: `Hello ${name},\n\nYour PYTHAGORAS verification code is: ${code}\n\nIt expires in ${CODE_TTL_MS / 60000} minutes. If you did not try to create an account, you can ignore this email.\n`,
  }
}

export type StartResult = { ok: true; code: string } | { ok: false; retryAfterSeconds: number }

/** Save (or refresh) the pending sign-up and return a new code to email. Respects a 60 s resend gap. */
export async function startSignup(input: { name: string; email: string; passwordHash: string }): Promise<StartResult> {
  const email = input.email.trim().toLowerCase()
  const existing = await db.signupVerification.findUnique({ where: { email } })
  if (existing) {
    const wait = existing.lastSentAt.getTime() + RESEND_COOLDOWN_MS - Date.now()
    if (wait > 0) return { ok: false, retryAfterSeconds: Math.ceil(wait / 1000) }
  }
  const code = generateCode()
  const data = {
    name: input.name,
    passwordHash: input.passwordHash,
    codeHash: hashCode(email, code),
    attempts: 0,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
    lastSentAt: new Date(),
  }
  await db.signupVerification.upsert({ where: { email }, create: { email, ...data }, update: data })
  return { ok: true, code }
}

export type ResendResult =
  | { ok: true; code: string; name: string }
  | { ok: false; reason: 'NONE' }
  | { ok: false; reason: 'COOLDOWN'; retryAfterSeconds: number }

/** New code for an existing pending sign-up. */
export async function resendCode(emailRaw: string): Promise<ResendResult> {
  const email = emailRaw.trim().toLowerCase()
  const rec = await db.signupVerification.findUnique({ where: { email } })
  if (!rec) return { ok: false, reason: 'NONE' }
  const wait = rec.lastSentAt.getTime() + RESEND_COOLDOWN_MS - Date.now()
  if (wait > 0) return { ok: false, reason: 'COOLDOWN', retryAfterSeconds: Math.ceil(wait / 1000) }
  const code = generateCode()
  await db.signupVerification.update({
    where: { email },
    data: { codeHash: hashCode(email, code), attempts: 0, expiresAt: new Date(Date.now() + CODE_TTL_MS), lastSentAt: new Date() },
  })
  return { ok: true, code, name: rec.name }
}

export type VerifyResult = { ok: true } | { ok: false; reason: 'INVALID' | 'EXPIRED' | 'TOO_MANY' }

/** Check the code; on success create the student account (email marked verified) and clear the pending row. */
export async function verifySignup(emailRaw: string, code: string): Promise<VerifyResult> {
  const email = emailRaw.trim().toLowerCase()
  const rec = await db.signupVerification.findUnique({ where: { email } })
  if (!rec) return { ok: false, reason: 'INVALID' }
  if (rec.expiresAt.getTime() < Date.now()) {
    await db.signupVerification.deleteMany({ where: { email } })
    return { ok: false, reason: 'EXPIRED' }
  }
  if (rec.attempts >= MAX_ATTEMPTS) {
    await db.signupVerification.deleteMany({ where: { email } })
    return { ok: false, reason: 'TOO_MANY' }
  }
  if (!codeMatches(email, code, rec.codeHash)) {
    await db.signupVerification.update({ where: { email }, data: { attempts: { increment: 1 } } })
    return { ok: false, reason: 'INVALID' }
  }
  try {
    await db.$transaction(async (tx) => {
      const exists = await tx.user.findUnique({ where: { email }, select: { id: true } })
      if (!exists) {
        await tx.user.create({
          data: { name: rec.name, email, passwordHash: rec.passwordHash, role: 'STUDENT', emailVerified: new Date() },
        })
      }
      await tx.signupVerification.deleteMany({ where: { email } })
    })
  } catch (e) {
    // a double-click can race; if the account now exists the code was fine
    const exists = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (!exists) throw e
  }
  return { ok: true }
}
