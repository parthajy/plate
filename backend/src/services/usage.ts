import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { usageEvents } from '../db/schema.js';
import { BudgetExceededError } from '../lib/errors.js';

// Per-call cost estimates ($/M tokens for claude-sonnet-4-6 today).
// Used to fill usage_events.est_cost_usd — informational, not load-bearing.
const INPUT_USD_PER_M = 3.0;
const OUTPUT_USD_PER_M = 15.0;

export type UsageKind = 'scan' | 'recipe' | 'coach';

// Daily caps per user. Free-tier numbers — the universal cap until
// monetization ships. When the paywall is on, premium users will get the
// higher cap (30 / 20 / 50) via an `isPremium` branch here.
//
// At 1000 free users worst-case (everyone maxing out), this cap holds AI
// spend to ~$95/day. Realistic 20% DAU is ~$15/day.
const DAILY_CAPS: Record<UsageKind, number> = {
  scan: 3,
  recipe: 1,
  coach: 10,
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
  const cap = DAILY_CAPS[kind];
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
