/**
 * Locks the leftover @demo.test accounts that could not be deleted because they have orders.
 * Their order history stays, but nobody can sign in to them: the password is replaced by a random
 * value that is never shown, the role is set to STUDENT, and existing sessions are invalidated.
 *
 *   pnpm exec tsx scripts/lock-demo-accounts.ts            # dry run: lists the accounts
 *   pnpm exec tsx scripts/lock-demo-accounts.ts --apply    # locks them
 */
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { db } from '../src/lib/db'

async function main() {
  const apply = process.argv.includes('--apply')

  const users = await db.user.findMany({
    where: { email: { endsWith: '@demo.test' } },
    select: { id: true, email: true, role: true },
    orderBy: { email: 'asc' },
  })

  if (users.length === 0) {
    console.log('No @demo.test accounts found. Nothing to do.')
    return
  }

  console.log(`${apply ? 'LOCKING' : 'DRY RUN, would lock'} ${users.length} account(s):`)
  for (const u of users) console.log(`  ${u.email}  [${u.role}]`)

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to lock.')
    return
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12)
  const { count } = await db.user.updateMany({
    where: { id: { in: users.map((u) => u.id) } },
    data: { passwordHash, role: 'STUDENT', sessionVersion: { increment: 1 } },
  })

  console.log(`\nLocked ${count} account(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
