import { createHash, randomBytes } from 'crypto'
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
