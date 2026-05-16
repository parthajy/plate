import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { rateLimitBuckets } from '../db/schema.js';
import { AppError } from './errors.js';

// Simple token-bucket rate limiter backed by Postgres. The bucket starts
// "full" (capacity tokens) and accrues at refillPerSecond. Each call deducts
// 1 token; if tokens < 1 we throw 429. State is global per (key, action).
//
// Pick keys to fit the abuse surface:
//   `ip:<addr>:auth.request-otp`            — protect Resend $ from email flood
//   `email:<addr>:auth.verify-otp`          — protect from brute-force
//   `user:<uuid>:ai.scan`                   — protect Anthropic $
//
// Memory-light: one row per (key, action) and updated in place.

export interface RateLimit {
  action: string;
  /** Maximum tokens the bucket can hold (and starts at). */
  capacity: number;
  /** Steady-state refill rate. capacity/refillPerSecond ≈ time to recover from empty. */
  refillPerSecond: number;
}

export const limits = {
  authRequestOtpPerIp: {
    action: 'auth.request-otp.ip',
    capacity: 5,
    refillPerSecond: 5 / 60, // 5 per minute
  },
  authRequestOtpPerEmail: {
    action: 'auth.request-otp.email',
    capacity: 5,
    refillPerSecond: 5 / (60 * 10), // 5 per 10 min
  },
  authVerifyOtpPerEmail: {
    action: 'auth.verify-otp.email',
    capacity: 10,
    refillPerSecond: 10 / (60 * 10), // 10 attempts per 10 min
  },
  oauthExchangePerIp: {
    action: 'auth.oauth.ip',
    capacity: 20,
    refillPerSecond: 20 / 60,
  },
} as const;

/**
 * Try to consume one token. Throws `429` if empty.
 *
 * @param key opaque caller key (ip / email / userId)
 * @param limit one of the configs in `limits`
 */
export async function rateLimit(key: string, limit: RateLimit): Promise<void> {
  // Use Postgres's `now()` for all timestamps so no JS Date crosses the
  // sql-template parameter boundary (the `postgres` driver doesn't serialize
  // Date inside template-literal slots reliably).
  const result = await db
    .insert(rateLimitBuckets)
    .values({
      key,
      action: limit.action,
      tokens: (limit.capacity - 1).toString(),
      // updatedAt has defaultNow() in schema — omit to use the default.
    })
    .onConflictDoUpdate({
      target: [rateLimitBuckets.key, rateLimitBuckets.action],
      set: {
        tokens: sql`least(
          ${limit.capacity}::numeric,
          ${rateLimitBuckets.tokens} +
            extract(epoch from (now() - ${rateLimitBuckets.updatedAt})) * ${limit.refillPerSecond}
        ) - 1`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ tokens: rateLimitBuckets.tokens });

  const tokens = Number(result[0]?.tokens ?? 0);
  if (tokens < 0) {
    // We over-debited an empty bucket — restore and reject.
    await db
      .update(rateLimitBuckets)
      .set({ tokens: '0' })
      .where(and(eq(rateLimitBuckets.key, key), eq(rateLimitBuckets.action, limit.action)));
    const retryS = Math.ceil(1 / Math.max(limit.refillPerSecond, 0.0001));
    throw new AppError('RATE_LIMITED', `Too many tries — wait ~${retryS}s and try again`, 429, {
      retryAfterSeconds: retryS,
    });
  }
}

/** Convenience: extract a usable IP key, falling back when behind proxy. */
export function ipKey(addr: string | undefined): string {
  return `ip:${addr ?? 'unknown'}`;
}

export function emailKey(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}

export function userKey(userId: string): string {
  return `user:${userId}`;
}
