interface RateLimitEntry {
  count: number
  resetAt: number
}

/**
 * Simple in-memory rate limiter using Map.
 * Note: This is for single-instance deployments.
 * For multi-instance deployments, use Redis-based rate limiting.
 */
const rateLimitStore = new Map<string, RateLimitEntry>()
// Mutex map to prevent race conditions during check-and-increment
const rateLimitMutex = new Map<string, boolean>()

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

/**
 * Check if a request should be rate limited.
 * Uses a simple mutex per key to prevent race conditions.
 * @param key - Unique identifier (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if within limit, false if rate limited
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  
  // Acquire mutex for this key
  if (rateLimitMutex.get(key)) {
    // Another request is currently checking this key, fail-safe by allowing
    // In high contention, this prevents race but may allow slight overruns
    return true
  }
  rateLimitMutex.set(key, true)
  
  try {
    const entry = rateLimitStore.get(key)

    if (!entry || entry.resetAt < now) {
      // Create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      return true
    }

    if (entry.count >= limit) {
      // Rate limited
      return false
    }

    // Increment count atomically within mutex
    entry.count++
    rateLimitStore.set(key, entry)
    return true
  } finally {
    // Always release mutex
    rateLimitMutex.delete(key)
  }
}

/**
 * Get remaining requests for a key.
 * @returns Number of remaining requests, or 0 if rate limited
 */
export function getRemainingRequests(key: string, limit: number): number {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    return limit
  }

  return Math.max(0, limit - entry.count)
}

/**
 * Get reset time for a rate limit key.
 * @returns Reset time in milliseconds, or 0 if no limit active
 */
export function getRateLimitReset(key: string): number {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    return 0
  }

  return entry.resetAt - now
}

/**
 * Create rate limit headers for response.
 */
export function createRateLimitHeaders(
  key: string,
  limit: number
): Record<string, string> {
  const remaining = getRemainingRequests(key, limit)
  const resetMs = getRateLimitReset(key)

  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetMs > 0 ? Math.ceil(Date.now() + resetMs).toString() : '0',
  }
}

// Preset rate limit configurations
export const RateLimits = {
  // 10 requests per minute per IP for payment init
  PAYMENT_INIT: { limit: 10, windowMs: 60000 },

  // 5 requests per minute per user for payout requests
  PAYOUT_REQUEST: { limit: 5, windowMs: 60000 },

  // 5 login attempts per minute per IP
  LOGIN_ATTEMPT: { limit: 5, windowMs: 60000 },

  // 3 plan changes per hour per admin
  ADMIN_PLAN_CHANGE: { limit: 3, windowMs: 3600000 },
}
