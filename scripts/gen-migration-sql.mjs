/**
 * Generates additive migration SQL by running prisma migrate diff
 * and writes output to prisma/migrations/<timestamp>_<name>/migration.sql
 * Does NOT apply anything to the database.
 */
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const name = process.argv[2] ?? 'trainee_footer_quiz_progress'
const ts = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
const dir = join('prisma', 'migrations', `${ts}_${name}`)

const directUrl = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL ?? ''
if (!directUrl) { console.error('DATABASE_URL_DIRECT not set'); process.exit(1) }

console.log(`Generating diff from live DB → schema.prisma ...`)
let sql
try {
  sql = execSync(
    `pnpm exec prisma migrate diff --from-url="${directUrl}" --to-schema-datamodel=prisma/schema.prisma --script`,
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] }
  )
} catch (e) {
  console.error('prisma migrate diff failed:', e.message)
  process.exit(1)
}

if (!sql.trim()) {
  console.log('No schema differences detected — migration SQL is empty.')
  process.exit(0)
}

mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, 'migration.sql'), sql, 'utf8')
console.log(`\nMigration SQL written to: ${dir}/migration.sql`)
console.log('\n--- SQL PREVIEW ---\n' + sql + '\n--- END ---')
