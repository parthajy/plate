import Anthropic from '@anthropic-ai/sdk';
import { and, asc, desc, eq, gte, lt } from 'drizzle-orm';
import { config } from '../../config.js';
import { AppError } from '../../lib/errors.js';
import { db } from '../../db/client.js';
import { coachMessages, foodLogs, profiles, users, workouts } from '../../db/schema.js';
import { assertWithinBudget, recordUsage } from '../usage.js';
import { COACH_SYSTEM } from './prompts/coach.js';

let cached: Anthropic | null = null;

function client(): Anthropic {
  if (cached) return cached;
  if (!config.ANTHROPIC_API_KEY) {
    throw new AppError('AI_NOT_CONFIGURED', 'Anthropic API key not set', 500);
  }
  cached = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  return cached;
}

const COACH_MODEL = 'claude-sonnet-4-6';
const HISTORY_LIMIT = 20;

interface UserContext {
  displayName: string | null;
  goal: string | null;
  goalRateKgWk: number | null;
  weightKg: number | null;
  heightCm: number | null;
  age: number | null;
  activities: string[];
  units: string;
  targets: {
    kcal: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
  };
  today: {
    date: string;
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    entries: { mealType: string | null; name: string; grams: number }[];
    workouts: { type: string; durationMin: number; kcalBurned: number }[];
  };
}

async function loadContext(userId: string): Promise<UserContext> {
  const userRow = await db
    .select({
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const profRow = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);

  const profile = profRow[0];
  const ageYears = profile?.birthdate
    ? Math.floor(
        (Date.now() - new Date(profile.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
      )
    : null;

  // Today's logs, server-local UTC day.
  const todayIso = new Date().toISOString().slice(0, 10);
  const start = new Date(`${todayIso}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const todayRows = await db
    .select({
      mealType: foodLogs.mealType,
      foodId: foodLogs.foodId,
      customName: foodLogs.customName,
      grams: foodLogs.grams,
      kcal: foodLogs.kcal,
      proteinG: foodLogs.proteinG,
      carbsG: foodLogs.carbsG,
      fatG: foodLogs.fatG,
    })
    .from(foodLogs)
    .where(
      and(eq(foodLogs.userId, userId), gte(foodLogs.loggedAt, start), lt(foodLogs.loggedAt, end)),
    );

  const todayWorkouts = await db
    .select({
      type: workouts.type,
      durationMin: workouts.durationMin,
      kcalBurned: workouts.kcalBurned,
    })
    .from(workouts)
    .where(
      and(eq(workouts.userId, userId), gte(workouts.startedAt, start), lt(workouts.startedAt, end)),
    );

  const totals = todayRows.reduce(
    (acc, r) => ({
      kcal: acc.kcal + Number(r.kcal),
      proteinG: acc.proteinG + Number(r.proteinG),
      carbsG: acc.carbsG + Number(r.carbsG),
      fatG: acc.fatG + Number(r.fatG),
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  return {
    displayName: userRow[0]?.displayName ?? null,
    goal: profile?.goal ?? null,
    goalRateKgWk: profile?.goalRateKgWk ? Number(profile.goalRateKgWk) : null,
    weightKg: profile?.weightKg ? Number(profile.weightKg) : null,
    heightCm: profile?.heightCm ?? null,
    age: ageYears,
    activities: profile?.activities ?? [],
    units: profile?.units ?? 'metric',
    targets: {
      kcal: profile?.dailyKcal ?? null,
      proteinG: profile?.dailyProteinG ?? null,
      carbsG: profile?.dailyCarbsG ?? null,
      fatG: profile?.dailyFatG ?? null,
    },
    today: {
      date: todayIso,
      kcal: Math.round(totals.kcal),
      proteinG: Math.round(totals.proteinG),
      carbsG: Math.round(totals.carbsG),
      fatG: Math.round(totals.fatG),
      entries: todayRows.map((r) => ({
        mealType: r.mealType,
        name: r.customName ?? '(logged food)',
        grams: Number(r.grams),
      })),
      workouts: todayWorkouts.map((w) => ({
        type: w.type,
        durationMin: w.durationMin ?? 0,
        kcalBurned: w.kcalBurned ?? 0,
      })),
    },
  };
}

function renderContext(ctx: UserContext): string {
  const lines: string[] = [`CONTEXT (only what's listed here is known about the user):`];
  if (ctx.displayName) lines.push(`name: ${ctx.displayName}`);
  if (ctx.age != null) lines.push(`age: ${ctx.age}`);
  if (ctx.heightCm) lines.push(`height: ${ctx.heightCm} cm`);
  if (ctx.weightKg) lines.push(`weight: ${ctx.weightKg} kg`);
  if (ctx.goal) {
    const rate = ctx.goalRateKgWk != null ? ` at ${ctx.goalRateKgWk} kg/wk` : '';
    lines.push(`goal: ${ctx.goal}${rate}`);
  }
  if (ctx.activities.length) lines.push(`activities: ${ctx.activities.join(', ')}`);
  const t = ctx.targets;
  if (t.kcal != null) {
    lines.push(`daily targets: ${t.kcal} kcal · P ${t.proteinG}g · C ${t.carbsG}g · F ${t.fatG}g`);
  }
  const today = ctx.today;
  lines.push(
    `today (${today.date}) so far: ${today.kcal} kcal · P ${today.proteinG}g · C ${today.carbsG}g · F ${today.fatG}g`,
  );
  if (today.entries.length) {
    const summary = today.entries
      .slice(0, 10)
      .map((e) => `${e.mealType ?? '?'}: ${e.name} (${Math.round(e.grams)}g)`)
      .join('; ');
    lines.push(`today's log: ${summary}`);
  } else {
    lines.push(`today's log: (nothing logged yet)`);
  }
  if (today.workouts.length) {
    const w = today.workouts
      .map((wk) => `${wk.type} ${wk.durationMin}min (~${wk.kcalBurned} kcal)`)
      .join('; ');
    lines.push(`today's workouts: ${w}`);
  } else {
    lines.push(`today's workouts: (none)`);
  }
  return lines.join('\n');
}

export interface SendCoachMessageResult {
  userMessageId: string;
  assistantMessageId: string;
  assistantContent: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

export async function sendCoachMessage(
  userId: string,
  content: string,
): Promise<SendCoachMessageResult> {
  // 0. Budget gate — reject before we eat the bandwidth.
  await assertWithinBudget(userId, 'coach');

  // 1. Persist user turn first so it's in the transcript even if the model call fails.
  const userInsert = await db
    .insert(coachMessages)
    .values({ userId, role: 'user', content })
    .returning({ id: coachMessages.id });
  const userMessageId = userInsert[0]?.id;
  if (!userMessageId) throw new AppError('COACH_PERSIST_FAILED', 'Could not save message', 500);

  // 2. Load the last N messages (oldest first for the API). The freshly-inserted
  //    user message is included.
  const recent = await db
    .select({
      role: coachMessages.role,
      content: coachMessages.content,
    })
    .from(coachMessages)
    .where(eq(coachMessages.userId, userId))
    .orderBy(desc(coachMessages.createdAt))
    .limit(HISTORY_LIMIT);
  const history = recent.reverse();

  // 3. Build the volatile context block as a user message attached to the most recent
  //    user turn. Keeps the system prompt byte-stable for caching.
  const ctx = await loadContext(userId);
  const contextBlock = renderContext(ctx);

  const apiMessages: Anthropic.MessageParam[] = history.map((m, i) => {
    const isLastUserTurn = i === history.length - 1 && m.role === 'user';
    if (isLastUserTurn) {
      return {
        role: 'user',
        content: [
          { type: 'text', text: contextBlock },
          { type: 'text', text: m.content },
        ],
      };
    }
    return {
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    };
  });

  // 4. Call Claude.
  const response = await client().messages.create({
    model: COACH_MODEL,
    max_tokens: 600,
    system: [{ type: 'text', text: COACH_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: apiMessages,
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  const assistantContent = textBlock?.text?.trim() ?? '';
  if (!assistantContent) {
    throw new AppError('COACH_EMPTY', 'Coach returned no text', 502);
  }

  // 5. Persist assistant turn.
  const assistantInsert = await db
    .insert(coachMessages)
    .values({ userId, role: 'assistant', content: assistantContent })
    .returning({ id: coachMessages.id });
  const assistantMessageId = assistantInsert[0]?.id;
  if (!assistantMessageId) {
    throw new AppError('COACH_PERSIST_FAILED', 'Could not save assistant reply', 500);
  }

  await recordUsage({
    userId,
    kind: 'coach',
    model: COACH_MODEL,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  });

  return {
    userMessageId,
    assistantMessageId,
    assistantContent,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
  };
}

export async function listCoachMessages(
  userId: string,
  limit = 100,
): Promise<{ id: string; role: 'user' | 'assistant'; content: string; createdAt: Date }[]> {
  const rows = await db
    .select({
      id: coachMessages.id,
      role: coachMessages.role,
      content: coachMessages.content,
      createdAt: coachMessages.createdAt,
    })
    .from(coachMessages)
    .where(eq(coachMessages.userId, userId))
    .orderBy(asc(coachMessages.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    role: r.role === 'assistant' ? 'assistant' : 'user',
    content: r.content,
    createdAt: r.createdAt,
  }));
}
