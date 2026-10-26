import { PostgresRateLimiter } from './postgres'

/** REQ-126: swappable limiter interface (Redis later). */
export interface RateLimitResult {
  allowed: boolean
  attempts: number
  retryAfterSeconds: number
}

export interface RateLimiter {
  /** Atomically count one attempt for `key` inside a fixed window. */
  hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>
}

export const rateLimiter: RateLimiter = new PostgresRateLimiter()

const WINDOW = 15 * 60
const PER_IP = 20
const PER_IP_EMAIL = 5

/**
 * Two concurrent counters per attempt: per-IP (20 / 15 min) and per-IP+email (5 / 15 min).
 * Key format: "{ip}:{action}:{email}" (REQ-267); the per-IP counter uses "*" for email.
 */
export async function checkAuthRateLimit(
  ip: string,
  action: 'login' | 'signup' | 'forgot',
  email: string,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const normalised = email.trim().toLowerCase()
  const [byIp, byIpEmail] = await Promise.all([
    rateLimiter.hit(`${ip}:${action}:*`, PER_IP, WINDOW),
    rateLimiter.hit(`${ip}:${action}:${normalised}`, PER_IP_EMAIL, WINDOW),
  ])
  const allowed = byIp.allowed && byIpEmail.allowed
  return {
    allowed,
    retryAfterSeconds: Math.max(
      byIp.allowed ? 0 : byIp.retryAfterSeconds,
      byIpEmail.allowed ? 0 : byIpEmail.retryAfterSeconds,
    ),
  }
}
