import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { AppError, UnauthorizedError } from '../lib/errors.js';

// RevenueCat webhook payload — only fields we need. RC always sends more
// (product info, prices, environment, etc.) but we ignore the rest to
// avoid coupling to their wire format.
const RCEventSchema = z.object({
  event: z.object({
    type: z.string(),
    app_user_id: z.string(),
    product_id: z.string().optional(),
    store: z.string().optional(), // 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | …
    expiration_at_ms: z.number().nullable().optional(),
    environment: z.string().optional(),
  }),
});

// Map RC event type → our internal status. Anything not listed is ignored
// (logged but acknowledged with 200 so RC doesn't retry it forever).
function statusForEvent(type: string): string | null {
  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'NON_RENEWING_PURCHASE':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
    case 'SUBSCRIPTION_EXTENDED':
      return 'active';
    case 'CANCELLATION':
      return 'cancelled';
    case 'EXPIRATION':
      return 'expired';
    case 'BILLING_ISSUE':
      return 'billing_issue';
    default:
      return null;
  }
}

export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/revenuecat', async (req, reply) => {
    // Auth: RC sends our shared secret in the Authorization header. We
    // configure it in the RC dashboard → Project Settings → Webhooks →
    // "Authorization header value". Refuse unauthenticated calls.
    const secret = config.REVENUECAT_WEBHOOK_SECRET;
    if (!secret) {
      throw new AppError(
        'WEBHOOK_NOT_CONFIGURED',
        'RevenueCat webhook secret not configured on server',
        503,
      );
    }
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${secret}`) {
      throw new UnauthorizedError('Invalid webhook signature');
    }

    const payload = RCEventSchema.parse(req.body);
    const { event } = payload;

    const status = statusForEvent(event.type);
    if (status === null) {
      // Unhandled event type (TRANSFER, TEST, etc.). Acknowledge so RC stops
      // retrying — we log it for forensics.
      req.log.info(
        { rcEvent: event.type, appUserId: event.app_user_id },
        'rc webhook: ignored event type',
      );
      return reply.code(200).send({ ok: true, handled: false });
    }

    // app_user_id is the UUID we passed to Purchases.logIn() on mobile.
    // If we ever see a non-UUID here it means we never identified the user
    // (purchase was anonymous) — log and skip rather than crash.
    const userId = event.app_user_id;
    if (!/^[0-9a-f-]{36}$/i.test(userId)) {
      req.log.warn(
        { appUserId: userId, rcEvent: event.type },
        'rc webhook: non-uuid app_user_id, skipping',
      );
      return reply.code(200).send({ ok: true, handled: false });
    }

    const expiresAt =
      typeof event.expiration_at_ms === 'number' ? new Date(event.expiration_at_ms) : null;

    const updated = await db
      .update(users)
      .set({
        subscriptionStatus: status,
        subscriptionExpiresAt: expiresAt,
        ...(event.product_id ? { subscriptionProductId: event.product_id } : {}),
        ...(event.store ? { subscriptionStore: event.store } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    req.log.info(
      {
        rcEvent: event.type,
        appUserId: userId,
        status,
        expiresAt: expiresAt?.toISOString() ?? null,
        productId: event.product_id ?? null,
        store: event.store ?? null,
        matchedRows: updated.length,
      },
      'rc webhook: subscription updated',
    );

    return reply.code(200).send({ ok: true, handled: true, status });
  });
}
