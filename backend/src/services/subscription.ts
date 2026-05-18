import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';

// Statuses that grant entitlement (active subscription, or in grace period
// after a cancellation but before expires_at). RevenueCat surfaces these
// distinctly: an `active` user is paying; a `cancelled` user has turned off
// auto-renew but still owns the period they paid for.
const ACTIVE_STATUSES = new Set(['active', 'cancelled', 'billing_issue', 'in_grace_period']);

/**
 * Pure: given a subscription_status string and an expires_at, decide whether
 * the user is currently entitled to premium features. Exported so the same
 * logic runs in route handlers and in `/v1/me`'s response shaping.
 */
export function isUserPremium(
  status: string | null | undefined,
  expiresAt: Date | null | undefined,
): boolean {
  if (!status || !ACTIVE_STATUSES.has(status)) return false;
  if (!expiresAt) return status === 'active'; // RC sometimes omits expires for lifetime/promo grants
  return expiresAt.getTime() > Date.now();
}

/**
 * Fetch the user's current entitlement state. One row by id — cheap. Use
 * from inside AI-call hot paths to gate caps.
 */
export async function getUserEntitlement(userId: string): Promise<{
  isPremium: boolean;
  status: string;
  expiresAt: Date | null;
}> {
  const rows = await db
    .select({
      status: users.subscriptionStatus,
      expiresAt: users.subscriptionExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row) return { isPremium: false, status: 'free', expiresAt: null };
  return {
    isPremium: isUserPremium(row.status, row.expiresAt),
    status: row.status,
    expiresAt: row.expiresAt,
  };
}
