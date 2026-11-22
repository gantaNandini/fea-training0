/**
 * Replace the old contact address in saved site content (settings, About/legal pages, event and course text).
 *   pnpm exec tsx scripts/replace-email.ts            # dry run: lists every place it appears, changes nothing
 *   pnpm exec tsx scripts/replace-email.ts --apply    # writes the change in one transaction
 *
 * Only the exact address info@pe-fea.com is replaced (case-insensitive). Any other pe-fea.com text
 * (for example a web address) is listed but left alone so it can be decided by hand.
 * Tables that hold people's data (users, orders, payments, contact messages, subscribers, ...) are never touched.
 * Reads DATABASE_URL from the environment; nothing is stored in the repo.
 */
import { PrismaClient } from '@prisma/client'

const OLD = 'info@pe-fea.com'
const NEW = 'info@fea-training.com'
const OLD_RE = 'info@pe-fea\\.com'
const ANY = 'pe-fea.com'

/** Never scanned or changed. */
const SKIP_TABLES = new Set([
  'User', 'Account', 'VerificationToken', 'PasswordResetToken', 'ContactMessage', 'NewsletterSubscriber',
  'RateLimit', 'AuditLog', 'Order', 'OrderItem', 'Payment', 'ManualPayment', 'Enrollment', 'EventRegistration',
  'Certificate', 'Review', 'CartItem', 'WishlistItem', 'QuizAttempt', 'LessonProgress', '_prisma_migrations',
])

const db = new PrismaClient()
const q = (id: string) => `"${id.replace(/"/g, '""')}"`

interface Col { table_name: string; column_name: string; data_type: string; udt_name: string }
interface Hit { table: string; column: string; id: string | null; snippet: string }

async function main() {
  const apply = process.argv.includes('--apply')
  const cols = await db.$queryRawUnsafe<Col[]>(
    `SELECT c.table_name, c.column_name, c.data_type, c.udt_name FROM information_schema.columns c
     JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
     WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE' ORDER BY c.table_name, c.ordinal_position`,
  )
  const targets = cols.filter((c) => {
    if (SKIP_TABLES.has(c.table_name)) return false
    if (c.data_type === 'text' || c.data_type === 'character varying' || c.data_type === 'jsonb') return true
    return c.data_type === 'ARRAY' && (c.udt_name === '_text' || c.udt_name === '_varchar')
  })
  const hasId = new Set(cols.filter((c) => c.column_name === 'id').map((c) => c.table_name))

  const asText = (c: Col) => (c.data_type === 'ARRAY' ? `array_to_string(${q(c.column_name)}, E'\\n')` : `${q(c.column_name)}::text`)
  const hits: Hit[] = []
  const others: Hit[] = []
  for (const c of targets) {
    const idSel = hasId.has(c.table_name) ? `"id"::text` : 'NULL'
    const rows = await db.$queryRawUnsafe<Array<{ id: string | null; txt: string }>>(
      `SELECT ${idSel} AS id, ${asText(c)} AS txt FROM ${q(c.table_name)} WHERE ${asText(c)} ILIKE '%${ANY}%'`,
    )
    for (const r of rows) {
      const lower = r.txt.toLowerCase()
      const i = lower.indexOf(ANY)
      const snippet = r.txt.slice(Math.max(0, i - 30), i + ANY.length + 30).replace(/\s+/g, ' ')
      const rec = { table: c.table_name, column: c.column_name, id: r.id, snippet }
      if (new RegExp(OLD_RE, 'i').test(r.txt)) hits.push(rec)
      if (r.txt.replace(new RegExp(OLD_RE, 'gi'), '').toLowerCase().includes(ANY)) others.push(rec)
    }
  }

  console.log(`\n${OLD} found in ${hits.length} place(s):`)
  for (const h of hits) console.log(`  ${h.table}.${h.column} [${h.id ?? 'no id'}]  ...${h.snippet}...`)
  console.log(`\nOther "${ANY}" text that will NOT be changed (${others.length}):`)
  for (const h of others) console.log(`  ${h.table}.${h.column} [${h.id ?? 'no id'}]  ...${h.snippet}...`)

  const setting = await db.siteSetting.findUnique({ where: { key: 'email' } })
  console.log(`\nSite setting "email" is currently: ${setting ? setting.value : '(not set)'}`)

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to write the change.')
    return
  }

  let changed = 0
  await db.$transaction(async (tx) => {
    for (const c of targets) {
      const col = q(c.column_name)
      const tbl = q(c.table_name)
      let n: number
      if (c.data_type === 'ARRAY') {
        n = await tx.$executeRawUnsafe(
          `UPDATE ${tbl} SET ${col} = ARRAY(SELECT regexp_replace(x, '${OLD_RE}', '${NEW}', 'gi') FROM unnest(${col}) WITH ORDINALITY AS t(x, o) ORDER BY o)
           WHERE EXISTS (SELECT 1 FROM unnest(${col}) AS y WHERE y ILIKE '%${OLD}%')`,
        )
      } else if (c.data_type === 'jsonb') {
        n = await tx.$executeRawUnsafe(
          `UPDATE ${tbl} SET ${col} = regexp_replace(${col}::text, '${OLD_RE}', '${NEW}', 'gi')::jsonb WHERE ${col}::text ILIKE '%${OLD}%'`,
        )
      } else {
        n = await tx.$executeRawUnsafe(
          `UPDATE ${tbl} SET ${col} = regexp_replace(${col}, '${OLD_RE}', '${NEW}', 'gi') WHERE ${col} ILIKE '%${OLD}%'`,
        )
      }
      if (n) console.log(`  updated ${n} row(s) in ${c.table_name}.${c.column_name}`)
      changed += n
    }
  })
  console.log(`\nDone. ${changed} row(s) updated.`)

  const left = await db.siteSetting.findMany({ where: { value: { contains: OLD, mode: 'insensitive' } } })
  console.log(left.length === 0 ? `No settings still contain ${OLD}.` : `WARNING: ${left.length} setting(s) still contain ${OLD}.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
