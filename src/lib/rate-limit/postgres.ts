import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import type { RateLimiter, RateLimitResult } from './index'

/** Atomic upsert: a single statement increments the counter or restarts an expired window. */
export class PostgresRateLimiter implements RateLimiter {
  async hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const rows = await db.$queryRaw<{ attempts: number; retryAfter: number }[]>`
      INSERT INTO "RateLimit" ("id", "key", "attempts", "resetAt")
      VALUES (${randomUUID()}, ${key}, 1, now() + make_interval(secs => ${windowSeconds}::double precision))
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit"."attempts" + 1 END,
        "resetAt"  = CASE WHEN "RateLimit"."resetAt" <= now()
                          THEN now() + make_interval(secs => ${windowSeconds}::double precision)
                          ELSE "RateLimit"."resetAt" END
      RETURNING "attempts"::int AS "attempts",
                GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("resetAt" - now()))))::int AS "retryAfter"
    `
    const row = rows[0]
    const attempts = row?.attempts ?? 1
    return {
      allowed: attempts <= limit,
      attempts,
      retryAfterSeconds: row?.retryAfter ?? windowSeconds,
    }
  }
}
