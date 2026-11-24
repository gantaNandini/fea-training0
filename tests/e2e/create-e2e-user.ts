/**
 * CLI helper called by signUpAndLogin in helpers.ts.
 * Usage:  pnpm tsx tests/e2e/create-e2e-user.ts <email> <password>
 * Creates a fully-verified STUDENT so e2e tests can log in without SMTP.
 * Never used in production; safe to leave in the repo (guarded by NODE_ENV check).
 */
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const [, , email, password] = process.argv
if (!email || !password) {
  console.error('Usage: create-e2e-user.ts <email> <password>')
  process.exit(1)
}

const db = new PrismaClient()
const hash = await bcrypt.hash(password, 10)
await db.user.create({
  data: { email, name: 'E2E Student', passwordHash: hash, role: 'STUDENT', emailVerified: new Date() },
})
await db.$disconnect()
console.log(`created: ${email}`)
