import { createHash, randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export interface AuthState {
  id: string
  email: string
  name: string | null
  image: string | null
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  sessionVersion: number
}

const authSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
  sessionVersion: true,
} as const

/** Fresh DB read used for sensitive actions (REQ-121A). Never cached. */
export async function getAuthState(id: string): Promise<AuthState | null> {
  return db.user.findUnique({ where: { id }, select: authSelect })
}

export async function getUserForLogin(email: string) {
  return db.user.findUnique({ where: { email: email.toLowerCase() } })
}

export async function emailExists(email: string): Promise<boolean> {
  const u = await db.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } })
  return !!u
}

export async function createStudent(input: { name: string; email: string; passwordHash: string }) {
  return db.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: 'STUDENT',
    },
    select: { id: true },
  })
}

export async function getProfile(id: string) {
  return db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, bio: true, image: true, passwordHash: true },
  })
}

export async function updateProfile(
  id: string,
  data: { name: string; phone?: string | null; bio?: string | null },
) {
  return db.user.update({
    where: { id },
    data: { name: data.name, phone: data.phone || null, bio: data.bio || null },
    select: { id: true },
  })
}

export async function setAvatar(id: string, image: string) {
  await db.user.update({ where: { id }, data: { image } })
}

/** Sets a new password hash and bumps sessionVersion so every older JWT becomes invalid (REQ-121A). */
export async function setPassword(id: string, passwordHash: string) {
  await db.user.update({
    where: { id },
    data: { passwordHash, sessionVersion: { increment: 1 } },
  })
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Returns the raw token (emailed) — only its hash is stored (REQ-124). */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await db.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })
  return token
}

/** Validates the token and applies the new password in one transaction. */
export async function consumePasswordResetToken(
  token: string,
  passwordHash: string,
): Promise<boolean> {
  const tokenHash = hashToken(token)
  return db.$transaction(async (tx) => {
    const row = await tx.passwordResetToken.findFirst({
      where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
    })
    if (!row) return false
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, used: false },
      data: { used: true },
    })
    if (claimed.count !== 1) return false
    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    })
    return true
  })
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  const row = await db.passwordResetToken.findFirst({
    where: { tokenHash: hashToken(token), used: false, expiresAt: { gt: new Date() } },
    select: { id: true },
  })
  return !!row
}

// ─── Email verification codes (REQ-123A) ─────────────────────────────────────

/** Generates a 6-digit code, bcrypt-hashes it, persists it, and returns the raw code for emailing. */
export async function createEmailVerificationCode(userId: string): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const codeHash = await bcrypt.hash(code, 10)
  await db.emailVerificationCode.create({
    data: {
      userId,
      codeHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  })
  return code
}

/** Checks the code, marks it used, sets User.emailVerified. Returns true on success. */
export async function consumeEmailVerificationCode(
  userId: string,
  code: string,
): Promise<boolean> {
  // Find the most recent unused, unexpired code for this user.
  const row = await db.emailVerificationCode.findFirst({
    where: { userId, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!row) return false
  const valid = await bcrypt.compare(code, row.codeHash)
  if (!valid) return false
  await db.$transaction([
    db.emailVerificationCode.update({ where: { id: row.id }, data: { used: true } }),
    db.user.update({ where: { id: userId }, data: { emailVerified: new Date() } }),
  ])
  return true
}
