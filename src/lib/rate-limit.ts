/**
 * Simple in-memory rate limiter (per-IP).
 * ─────────────────────────────────────────
 * In production, swap this for a Redis-backed store (e.g. @upstash/ratelimit).
 * This works correctly in a single-process Node.js dev server.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

/**
 * Returns `true` if the key is rate-limited (i.e. too many requests).
 *
 * @param key      – unique identifier (IP address, userId, etc.)
 * @param limit    – max requests per window
 * @param windowMs – time window in milliseconds
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count++
  if (entry.count > limit) return true

  return false
}

/**
 * Returns how many milliseconds until the window resets for a key.
 */
export function retryAfterMs(key: string): number {
  const entry = store.get(key)
  if (!entry) return 0
  return Math.max(0, entry.resetAt - Date.now())
}
