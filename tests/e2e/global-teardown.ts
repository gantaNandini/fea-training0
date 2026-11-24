/**
 * Playwright globalTeardown — runs once after all tests finish.
 *
 * Deletes:
 *   - User rows whose email matches e2e-*@example.test   (created by signUpAndLogin)
 *   - SignupVerification rows for the same pattern        (created by the signup e2e test,
 *     which submits the form but never completes the code step)
 *
 * Safety: re-checks the localhost guard so teardown also cannot touch a remote DB.
 */
import { PrismaClient } from '@prisma/client'

export default async function globalTeardown() {
  const dbUrl = process.env.DATABASE_URL ?? ''
  let host = ''
  try { host = new URL(dbUrl).hostname } catch { /* leave empty */ }
  if (host !== 'localhost' && host !== '127.0.0.1') {
    // Should never reach here (globalSetup already blocked), but be safe.
    throw new Error(
      `[e2e globalTeardown] REFUSED: DATABASE_URL host is "${host || '(unset)'}". ` +
      'Teardown may only run against localhost / 127.0.0.1.',
    )
  }

  const db = new PrismaClient()
  try {
    // SignupVerification rows have no FK to User, so delete them first.
    const svDel = await db.signupVerification.deleteMany({
      where: { email: { contains: '@example.test' } },
    })

    // Cascade on User deletes all related rows (orders, enrollments, progress …).
    const userDel = await db.user.deleteMany({
      where: {
        email: { startsWith: 'e2e-', contains: '@example.test' },
      },
    })

    // Also clean up any e2e-signup-* rows left by signup.spec.ts (which uses a
    // slightly different prefix but the same domain).
    const signupDel = await db.user.deleteMany({
      where: {
        email: { startsWith: 'e2e-signup-', contains: '@example.test' },
      },
    })

    console.log(
      `[e2e globalTeardown] Cleaned up ${userDel.count + signupDel.count} user(s), ` +
      `${svDel.count} SignupVerification row(s).`,
    )
  } finally {
    await db.$disconnect()
  }
}
