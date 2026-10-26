// One-time database initialisation (TASK-003).
//
//   pnpm db:init
//
// 1. `prisma migrate dev --name init`            -> tables, enums, indexes from schema.prisma
// 2. `prisma migrate dev --create-only ...`      -> empty migration for the raw SQL
// 3. copies prisma/raw/raw_constraints.sql into it (sequence, partial index, CHECKs, CourseStats view)
// 4. `prisma migrate dev`                        -> applies it
//
// If migrations already exist it only runs `prisma migrate dev`.
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const run = (cmd) => execSync(cmd, { stdio: 'inherit' })
const migrationsDir = path.join('prisma', 'migrations')
const rawSql = path.join('prisma', 'raw', 'raw_constraints.sql')

const existing = fs.existsSync(migrationsDir)
  ? fs.readdirSync(migrationsDir).filter((d) => /^\d{14}_/.test(d))
  : []

if (existing.length > 0) {
  console.log('Migrations already exist -> running `prisma migrate dev` only.')
  run('pnpm prisma migrate dev')
  process.exit(0)
}

run('pnpm prisma migrate dev --name init')
run('pnpm prisma migrate dev --create-only --name raw_constraints')

const rawDir = fs
  .readdirSync(migrationsDir)
  .filter((d) => d.endsWith('_raw_constraints'))
  .sort()
  .pop()

if (!rawDir) {
  console.error('Could not find the generated raw_constraints migration folder.')
  process.exit(1)
}

fs.writeFileSync(path.join(migrationsDir, rawDir, 'migration.sql'), fs.readFileSync(rawSql, 'utf8'))
console.log(`Wrote raw SQL into ${rawDir}/migration.sql`)

run('pnpm prisma migrate dev')
console.log('\nDatabase ready. Commit prisma/migrations/ to git. Next: pnpm db:seed')
