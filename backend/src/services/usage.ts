import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { usageEvents } from '../db/schema.js';
import { BudgetExceededError } from '../lib/errors.js';
import { getUserEntitlement } from './subscription.js';

// Per-call cost estimates ($/M tokens for claude-sonnet-4-6 today).
// Used to fill usage_events.est_cost_usd — informational, not load-bearing.
const INPUT_USD_PER_M = 3.0;
const OUTPUT_USD_PER_M = 15.0;

export type UsageKind = 'scan' | 'recipe' | 'coach';

// Daily caps per user, branched on subscription. Free protects costs while
// premium ($9.99/mo) buys generous-but-bounded headroom. Worst-case cost
// at 1000 free users hitting their caps: ~$95/day. Premium per-user at cap:
// ~$1/day in AI cost (vs $7.50 net revenue after Apple's cut).
const FREE_CAPS: Record<UsageKind, number> = {
  scan: 3,
  recipe: 1,
  coach: 10,
};

const PREMIUM_CAPS: Record<UsageKind, number> = {
  scan: 30,
  recipe: 20,
  coach: 50,
};

function startOfTodayUtc(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Throw `BudgetExceededError` if the user has already hit today's cap for
 * this AI kind. Call BEFORE the Claude request — cheaper to reject upfront
 * than to swallow another paid call.
 */
export async function assertWithinBudget(userId: string, kind: UsageKind): Promise<void> {
  const { isPremium } = await getUserEntitlement(userId);
  const cap = (isPremium ? PREMIUM_CAPS : FREE_CAPS)[kind];
  const start = startOfTodayUtc();
  const result = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        eq(usageEvents.kind, kind),
        gte(usageEvents.createdAt, start),
      ),
    );
  const used = result[0]?.n ?? 0;
  if (used >= cap) {
    throw new BudgetExceededError(
      `Daily ${kind} limit reached (${cap}/day). Resets at midnight UTC.`,
    );
  }
}

/**
 * Record a successful AI call. Best-effort — failures here should NOT cascade
 * into the user's response.
 */
export async function recordUsage(args: {
  userId: string;
  kind: UsageKind;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  const cost =
    (args.inputTokens * INPUT_USD_PER_M + args.outputTokens * OUTPUT_USD_PER_M) / 1_000_000;
  try {
    await db.insert(usageEvents).values({
      userId: args.userId,
      kind: args.kind,
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estCostUsd: cost.toFixed(4),
    });
  } catch {
    // Swallow — usage logging shouldn't break user-facing flows.
  }
}
