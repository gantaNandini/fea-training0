/**
 * Playwright globalTeardown — runs once after all tests finish.
 *
 * Deletes:
 *   - SignupVerification rows for *@example.test  (left by signup.spec.ts, which
 *     submits the form but never completes the code step)
 *   - User rows whose email starts with "e2e-" and ends with "@example.test"
 *     (created by signUpAndLogin in helpers.ts via create-e2e-user.ts)
 *
 * Both e2e-<timestamp>@example.test  AND  e2e-signup-<timestamp>@example.test
 * are covered by the startsWith("e2e-") + contains("@example.test") predicate.
 *
 * Safety: re-checks the localhost guard so teardown cannot touch a remote DB.
 */
import { PrismaClient } from '@prisma/client'

export default async function globalTeardown() {
  const dbUrl = process.env.DATABASE_URL ?? ''
  let host = ''
  try { host = new URL(dbUrl).hostname } catch { /* leave empty */ }
  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new Error(
      `[e2e globalTeardown] REFUSED: DATABASE_URL host is "${host || '(unset)'}". ` +
      'Teardown may only run against localhost / 127.0.0.1.',
    )
  }

  const db = new PrismaClient()
  try {
    // SignupVerification rows have no FK to User — delete before User to avoid
    // any potential unique-index surprises on re-runs.
    const svDel = await db.signupVerification.deleteMany({
      where: { email: { contains: '@example.test' } },
    })

    // Single predicate covers both e2e-<ts>@example.test and e2e-signup-<ts>@example.test.
    // Cascade on User removes all dependent rows (enrollments, progress, …).
    const userDel = await db.user.deleteMany({
      where: {
        email: { startsWith: 'e2e-', contains: '@example.test' },
      },
    })

    console.log(
      `[e2e globalTeardown] Deleted ${userDel.count} user(s) and ` +
      `${svDel.count} SignupVerification row(s) with @example.test addresses.`,
    )
  } finally {
    await db.$disconnect()
  }
}
