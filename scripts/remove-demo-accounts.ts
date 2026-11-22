/**
 * Find and optionally delete demo accounts (email ending with @demo.test).
 *
 *   pnpm exec tsx scripts/remove-demo-accounts.ts            # dry run: lists them with order/enrollment counts
 *   pnpm exec tsx scripts/remove-demo-accounts.ts --apply     # deletes only users with zero orders
 *
 * Never touches any email that does not end with @demo.test.
 * Reads DATABASE_URL from the environment; nothing is stored in the repo.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const apply = process.argv.includes('--apply')

  const users = await db.user.findMany({
    where: { email: { endsWith: '@demo.test' } },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      _count: { select: { orders: true, enrollments: true } },
    },
    orderBy: { email: 'asc' },
  })

  if (users.length === 0) {
    console.log('No @demo.test users found.')
    await db.$disconnect()
    return
  }

  console.log(`Found ${users.length} demo account(s):\n`)
  const safe: typeof users = []
  const blocked: typeof users = []
  for (const u of users) {
    const status = u._count.orders > 0 ? 'BLOCKED (has orders)' : 'safe to delete'
    console.log(`  ${u.email}  role=${u.role}  orders=${u._count.orders}  enrollments=${u._count.enrollments}  → ${status}`)
    if (u._count.orders > 0) blocked.push(u)
    else safe.push(u)
  }

  if (!apply) {
    console.log(`\nDry run only. ${safe.length} account(s) would be deleted, ${blocked.length} kept (have orders).`)
    console.log('Re-run with --apply to delete the safe ones.')
    await db.$disconnect()
    return
  }

  if (safe.length === 0) {
    console.log('\nNothing to delete — all demo accounts have orders.')
    await db.$disconnect()
    return
  }

  let deleted = 0
  for (const u of safe) {
    try {
      await db.user.deleteMany({ where: { id: u.id, email: { endsWith: '@demo.test' } } })
      deleted++
    } catch (e) {
      console.log(`  Failed to delete ${u.email}: ${(e as Error).message}`)
    }
  }

  console.log(`\nDeleted ${deleted} account(s).`)
  if (blocked.length > 0) {
    console.log(`Kept ${blocked.length} account(s) with orders:`)
    for (const u of blocked) {
      console.log(`  ${u.email}  orders=${u._count.orders}  enrollments=${u._count.enrollments}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
