/**
 * Playwright globalSetup — runs once before any test project.
 * Refuses to proceed unless DATABASE_URL points to localhost / 127.0.0.1,
 * so e2e tests can never accidentally run against the cloud (Neon) database.
 */
export default function globalSetup() {
  const dbUrl = process.env.DATABASE_URL ?? ''
  let host = ''
  try { host = new URL(dbUrl).hostname } catch { /* leave empty */ }
  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new Error(
      `[e2e globalSetup] REFUSED: DATABASE_URL host is "${host || '(unset)'}". ` +
      'Set DATABASE_URL to a local database before running Playwright.',
    )
  }
  console.log(`[e2e globalSetup] Database host: ${host} ✓`)
}
