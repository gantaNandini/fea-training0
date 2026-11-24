/**
 * CLI helper called by signUpAndLogin in helpers.ts.
 * Usage:  pnpm tsx tests/e2e/create-e2e-user.ts <email> <password>
 *
 * Creates a fully-verified STUDENT so e2e tests can log in without SMTP.
 * SAFETY: refuses to run unless DATABASE_URL points to localhost / 127.0.0.1.
 */
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

// ── localhost guard ────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL ?? ''
function extractHost(url: string): string {
  try { return new URL(url).hostname } catch { return '' }
}
const host = extractHost(dbUrl)
if (host !== 'localhost' && host !== '127.0.0.1') {
  console.error(
    `[create-e2e-user] REFUSED: DATABASE_URL host is "${host}". ` +
    'This script may only run against localhost / 127.0.0.1.',
  )
  process.exit(1)
}
// ──────────────────────────────────────────────────────────────────────────

const [, , email, password] = process.argv
if (!email || !password) {
  console.error('Usage: create-e2e-user.ts <email> <password>')
  process.exit(1)
}

const db = new PrismaClient()
const hash = await bcrypt.hash(password, 10)
await db.user.create({
  data: {
    email,
    name: 'E2E Student',
    passwordHash: hash,
    role: 'STUDENT',
    emailVerified: new Date(),
  },
})
await db.$disconnect()
console.log(`created: ${email}`)
