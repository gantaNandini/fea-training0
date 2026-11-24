/**
 * Creates or updates THE admin login.
 *
 *   PowerShell:  $env:ADMIN_PASSWORD = "your-long-password"; pnpm tsx scripts/set-admin.ts
 *   bash:        ADMIN_PASSWORD='your-long-password' pnpm tsx scripts/set-admin.ts
 *
 * Optional:
 *   ADMIN_EMAIL=...        default info@fea-training.com
 *   --demote-others        every other ADMIN account becomes a normal student
 *
 * The password is read from the environment, is never printed and is never stored in the code.
 * Anyone already logged in as this admin is signed out (their sessions are invalidated).
 */
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'info@fea-training.com').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD ?? ''
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error(`ADMIN_EMAIL is not a valid email: ${email}`)
  if (password.length < 12) throw new Error('Set ADMIN_PASSWORD to a password of at least 12 characters.')

  const passwordHash = await bcrypt.hash(password, 12)
  const admin = await db.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN', emailVerified: new Date(), sessionVersion: { increment: 1 } },
    create: { email, name: 'Pythagoras Admin', passwordHash, role: 'ADMIN', emailVerified: new Date() },
    select: { id: true, email: true },
  })
  console.log(`Admin ready: ${admin.email}  (log in at /admin-login)`)

  const others = await db.user.findMany({ where: { role: 'ADMIN', NOT: { id: admin.id } }, select: { id: true, email: true } })
  if (others.length === 0) return console.log('No other admin accounts exist.')
  console.log(`Other admin accounts: ${others.map((o) => o.email).join(', ')}`)
  if (process.argv.includes('--demote-others')) {
    await db.user.updateMany({ where: { id: { in: others.map((o) => o.id) } }, data: { role: 'STUDENT', sessionVersion: { increment: 1 } } })
    console.log('Those accounts are now normal students.')
  } else {
    console.log('They were left unchanged. Re-run with --demote-others to remove their admin access.')
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
