import { execSync } from 'node:child_process'

/** Applies migrations to DATABASE_URL_TEST once before the integration run. */
export default function setup() {
  const url =
    process.env.DATABASE_URL_TEST ??
    'postgresql://pythagoras:pythagoras@localhost:5433/pythagoras_test?schema=public'
  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  })
}
