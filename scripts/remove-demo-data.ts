/**
 * Removes the seeded demo data from the database in DATABASE_URL.
 *
 *   pnpm tsx scripts/remove-demo-data.ts                 dry run: shows what WOULD be removed, changes nothing
 *   pnpm tsx scripts/remove-demo-data.ts --apply         removes it
 *   pnpm tsx scripts/remove-demo-data.ts --apply --clear-stats   also blanks the placeholder homepage numbers
 *
 * Removed:
 *   - demo logins and demo students   (*@demo.test: student@, admin@, demo.student01..30@)
 *   - fake review authors and their fake reviews / enrolments   (reviewer01..12@seed.invalid)
 *   - demo coupons WELCOME10 and FLAT1000 (deactivated instead if a real order used them)
 * A user who has an order is never deleted (reported instead). Real accounts are never touched.
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const APPLY = process.argv.includes('--apply')
const CLEAR_STATS = process.argv.includes('--clear-stats')
const DEMO_DOMAINS = ['@demo.test', '@seed.invalid']
const DEMO_COUPONS = ['WELCOME10', 'FLAT1000']
const STAT_KEYS = ['stats_students', 'stats_years', 'stats_placement']

async function main() {
  console.log(APPLY ? '== APPLY MODE: changes will be written ==' : '== DRY RUN: nothing is changed (add --apply to remove) ==')

  const users = await db.user.findMany({
    where: { OR: DEMO_DOMAINS.map((d) => ({ email: { endsWith: d, mode: 'insensitive' as const } })) },
    select: { id: true, email: true, role: true, _count: { select: { orders: true, enrollments: true, reviews: true } } },
    orderBy: { email: 'asc' },
  })
  const deletable = users.filter((u) => u._count.orders === 0)
  const blocked = users.filter((u) => u._count.orders > 0)

  console.log(`\nDemo users found: ${users.length}`)
  for (const u of users) {
    console.log(`  ${u.role.padEnd(10)} ${u.email}  (enrolments ${u._count.enrollments}, reviews ${u._count.reviews}, orders ${u._count.orders})`)
  }
  if (blocked.length) {
    console.log('\nNOT deleted (they have orders, remove these by hand if they are really fake):')
    for (const u of blocked) console.log(`  ${u.email}`)
  }

  const coupons = await db.coupon.findMany({
    where: { code: { in: DEMO_COUPONS } },
    select: { id: true, code: true, _count: { select: { orders: true } } },
  })
  console.log(`\nDemo coupons found: ${coupons.map((c) => c.code).join(', ') || 'none'}`)

  const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { email: true }, orderBy: { email: 'asc' } })
  const keepAdmins = admins.filter((a) => !DEMO_DOMAINS.some((d) => a.email.toLowerCase().endsWith(d)))
  console.log(`\nAdmin accounts that will remain: ${keepAdmins.map((a) => a.email).join(', ') || 'NONE: run set-admin.ts next'}`)

  const stats = await db.siteSetting.findMany({ where: { key: { in: STAT_KEYS } } })
  console.log(`Homepage stat figures now: ${stats.map((s) => `${s.key}=${s.value}`).join(', ') || 'not set'}`)
  if (!CLEAR_STATS) console.log('  (placeholders 5000 / 20 / 90 come from the seed: set real numbers in Admin > Settings > Website, or rerun with --clear-stats)')

  if (!APPLY) {
    console.log('\nDry run finished. Re-run with --apply to make these changes.')
    return
  }

  await db.$transaction(async (tx) => {
    const del = await tx.user.deleteMany({ where: { id: { in: deletable.map((u) => u.id) } } })
    console.log(`\nDeleted demo users: ${del.count} (their enrolments, progress and reviews are removed with them)`)
    for (const c of coupons) {
      if (c._count.orders === 0) await tx.coupon.delete({ where: { id: c.id } })
      else await tx.coupon.update({ where: { id: c.id }, data: { active: false } })
    }
    console.log(`Handled demo coupons: ${coupons.length}`)
    if (CLEAR_STATS && stats.length) {
      await tx.siteSetting.updateMany({ where: { key: { in: STAT_KEYS } }, data: { value: '' } })
      console.log('Cleared homepage stat figures.')
    }
  })
  console.log('\nDone. Redeploy (vercel --prod) or wait for the cache to expire so cached course pages stop showing the old ratings.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
