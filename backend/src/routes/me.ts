import type { FastifyInstance } from 'fastify';
import { and, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  calculateTargets,
  OnboardingSchema,
  ProfilePatchSchema,
  ProfileTargets,
  StatsWindow,
  type Activity,
  type Goal,
  type Sex,
  type StatsResponse,
} from '@plate/shared';
import { db } from '../db/client.js';
import { foodLogs, foods, profiles, users, workouts } from '../db/schema.js';
import { NotFoundError, UnauthorizedError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth-middleware.js';
import { isUserPremium } from '../services/subscription.js';

const PatchUserSchema = z.object({
  displayName: z.string().min(1).max(64).optional(),
});

export async function meRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const userId = req.user.id;

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        onboardedAt: profiles.onboardedAt,
        sex: profiles.sex,
        birthdate: profiles.birthdate,
        heightCm: profiles.heightCm,
        weightKg: profiles.weightKg,
        activities: profiles.activities,
        goal: profiles.goal,
        goalRateKgWk: profiles.goalRateKgWk,
        dailyKcal: profiles.dailyKcal,
        dailyProteinG: profiles.dailyProteinG,
        dailyCarbsG: profiles.dailyCarbsG,
        dailyFatG: profiles.dailyFatG,
        units: profiles.units,
        timezone: profiles.timezone,
        subscriptionStatus: users.subscriptionStatus,
        subscriptionExpiresAt: users.subscriptionExpiresAt,
        subscriptionProductId: users.subscriptionProductId,
        subscriptionStore: users.subscriptionStore,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    const row = rows[0];
    if (!row) throw new UnauthorizedError('User no longer exists');
    return {
      ...row,
      subscriptionExpiresAt: row.subscriptionExpiresAt
        ? row.subscriptionExpiresAt.toISOString()
        : null,
      isPremium: isUserPremium(row.subscriptionStatus, row.subscriptionExpiresAt),
    };
  });

  fastify.patch('/', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const body = PatchUserSchema.parse(req.body);
    if (body.displayName !== undefined) {
      await db
        .update(users)
        .set({ displayName: body.displayName, updatedAt: new Date() })
        .where(eq(users.id, req.user.id));
    }
    return { ok: true };
  });

  fastify.patch('/profile', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const body = ProfilePatchSchema.parse(req.body);

    // displayName lives on users table
    if (body.displayName !== undefined) {
      await db
        .update(users)
        .set({ displayName: body.displayName, updatedAt: new Date() })
        .where(eq(users.id, req.user.id));
    }

    const profileFieldKeys = [
      'sex',
      'birthdate',
      'heightCm',
      'weightKg',
      'activities',
      'goal',
      'goalRateKgPerWeek',
      'units',
    ] as const;
    const profileTouched = profileFieldKeys.some((k) => body[k] !== undefined);
    if (!profileTouched) return { ok: true };

    // Load current profile to merge with the patch.
    const current = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, req.user.id))
      .limit(1);
    if (current.length === 0) {
      throw new NotFoundError('profile');
    }
    const p = current[0]!;

    const sex = (body.sex ?? p.sex) as Sex | null;
    const birthdate = body.birthdate ?? p.birthdate;
    const heightCm = body.heightCm ?? p.heightCm;
    const weightKg = body.weightKg ?? (p.weightKg ? Number(p.weightKg) : null);
    const activities = (body.activities ?? p.activities) as Activity[] | null;
    const goal = (body.goal ?? p.goal) as Goal | null;
    const goalRateKgPerWeek =
      body.goalRateKgPerWeek ?? (p.goalRateKgWk ? Number(p.goalRateKgWk) : null);

    // Body-composition fields that affect the BMR/TDEE math.
    const bodyCompTouched =
      body.sex !== undefined ||
      body.birthdate !== undefined ||
      body.heightCm !== undefined ||
      body.weightKg !== undefined ||
      body.activities !== undefined ||
      body.goal !== undefined ||
      body.goalRateKgPerWeek !== undefined;

    const canRecompute =
      bodyCompTouched &&
      !body.keepTargets &&
      sex &&
      birthdate &&
      heightCm != null &&
      weightKg != null &&
      activities &&
      activities.length > 0 &&
      goal &&
      goalRateKgPerWeek != null;

    const targets = canRecompute
      ? calculateTargets({
          sex: sex!,
          birthdate: birthdate!,
          heightCm: heightCm!,
          weightKg: weightKg!,
          activities: activities!,
          goal: goal!,
          goalRateKgPerWeek: goalRateKgPerWeek!,
        })
      : null;

    await db
      .update(profiles)
      .set({
        ...(body.sex !== undefined ? { sex: body.sex } : {}),
        ...(body.birthdate !== undefined ? { birthdate: body.birthdate } : {}),
        ...(body.heightCm !== undefined ? { heightCm: body.heightCm } : {}),
        ...(body.weightKg !== undefined ? { weightKg: body.weightKg.toFixed(2) } : {}),
        ...(body.activities !== undefined ? { activities: body.activities } : {}),
        ...(body.goal !== undefined ? { goal: body.goal } : {}),
        ...(body.goalRateKgPerWeek !== undefined
          ? { goalRateKgWk: body.goalRateKgPerWeek.toFixed(2) }
          : {}),
        ...(body.units !== undefined ? { units: body.units } : {}),
        ...(targets
          ? {
              dailyKcal: targets.dailyKcal,
              dailyProteinG: targets.dailyProteinG,
              dailyCarbsG: targets.dailyCarbsG,
              dailyFatG: targets.dailyFatG,
            }
          : {}),
      })
      .where(eq(profiles.userId, req.user.id));

    return { ok: true, recomputed: !!targets, ...(targets ? { targets } : {}) };
  });

  fastify.delete('/', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    // FK cascades drop profiles, food_logs, workouts, coach_messages, etc.
    await db.delete(users).where(eq(users.id, req.user.id));
    return reply.code(204).send();
  });

  fastify.get('/stats', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const params = z.object({ window: StatsWindow.default('30d') }).parse(req.query);
    const userId = req.user.id;

    const windowDays =
      params.window === '7d' ? 7 : params.window === '30d' ? 30 : params.window === '90d' ? 90 : 0;
    const since = windowDays > 0 ? new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000) : null;

    const foodWhere = since
      ? and(eq(foodLogs.userId, userId), gte(foodLogs.loggedAt, since))
      : eq(foodLogs.userId, userId);

    // Day-bucketed totals so we can compute averages over distinct logged days
    // rather than calendar days (the user's first week shouldn't drag down the
    // 90d average just because they joined yesterday).
    const dayBuckets = await db
      .select({
        day: sql<string>`date(${foodLogs.loggedAt})`.as('day'),
        kcal: sql<number>`coalesce(sum(${foodLogs.kcal}), 0)::float`,
        proteinG: sql<number>`coalesce(sum(${foodLogs.proteinG}), 0)::float`,
        carbsG: sql<number>`coalesce(sum(${foodLogs.carbsG}), 0)::float`,
        fatG: sql<number>`coalesce(sum(${foodLogs.fatG}), 0)::float`,
        entries: sql<number>`count(*)::int`,
      })
      .from(foodLogs)
      .where(foodWhere)
      .groupBy(sql`date(${foodLogs.loggedAt})`)
      .orderBy(sql`date(${foodLogs.loggedAt}) desc`);

    const daysLogged = dayBuckets.length;
    const totalKcal = dayBuckets.reduce((a, r) => a + Number(r.kcal), 0);
    const totalProtein = dayBuckets.reduce((a, r) => a + Number(r.proteinG), 0);
    const totalCarbs = dayBuckets.reduce((a, r) => a + Number(r.carbsG), 0);
    const totalFat = dayBuckets.reduce((a, r) => a + Number(r.fatG), 0);
    const totalEntries = dayBuckets.reduce((a, r) => a + r.entries, 0);

    const avg = (n: number) => (daysLogged > 0 ? n / daysLogged : 0);

    // Streak math: from today backwards, count consecutive days present.
    const present = new Set(dayBuckets.map((r) => r.day));
    const today = new Date();
    const toIso = (d: Date) => d.toISOString().slice(0, 10);
    let currentStreak = 0;
    {
      const cursor = new Date(today);
      // If today isn't logged yet, the streak is whatever it was through yesterday.
      if (!present.has(toIso(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
      while (present.has(toIso(cursor))) {
        currentStreak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
    }
    let longestStreak = 0;
    {
      const sorted = [...present].sort();
      let run = 0;
      let prev: string | null = null;
      for (const day of sorted) {
        if (prev) {
          const expected = new Date(prev);
          expected.setUTCDate(expected.getUTCDate() + 1);
          if (toIso(expected) === day) {
            run += 1;
          } else {
            run = 1;
          }
        } else {
          run = 1;
        }
        if (run > longestStreak) longestStreak = run;
        prev = day;
      }
    }

    // Workouts
    const workoutsWhere = since
      ? and(eq(workouts.userId, userId), gte(workouts.startedAt, since))
      : eq(workouts.userId, userId);
    const workoutsAgg = await db
      .select({
        total: sql<number>`count(*)::int`,
        totalMin: sql<number>`coalesce(sum(${workouts.durationMin}), 0)::int`,
        totalKcal: sql<number>`coalesce(sum(${workouts.kcalBurned}), 0)::int`,
      })
      .from(workouts)
      .where(workoutsWhere);
    const wo = workoutsAgg[0] ?? { total: 0, totalMin: 0, totalKcal: 0 };

    // Top foods (custom name or food name)
    const topRows = await db
      .select({
        name: sql<string>`coalesce(${foods.name}, ${foodLogs.customName}, 'Custom entry')`.as(
          'name',
        ),
        count: sql<number>`count(*)::int`,
      })
      .from(foodLogs)
      .leftJoin(foods, eq(foods.id, foodLogs.foodId))
      .where(foodWhere)
      .groupBy(sql`coalesce(${foods.name}, ${foodLogs.customName}, 'Custom entry')`)
      .orderBy(sql`count(*) desc`)
      .limit(5);

    // First-logged-at across all time (ignores window) — used for "you've been logging since…"
    const firstRow = await db
      .select({ first: sql<Date>`min(${foodLogs.loggedAt})` })
      .from(foodLogs)
      .where(eq(foodLogs.userId, userId));
    const firstLoggedAt = firstRow[0]?.first ? new Date(firstRow[0].first).toISOString() : null;

    const response: StatsResponse = {
      window: params.window,
      windowDays,
      daysLogged,
      currentStreak,
      longestStreak,
      avgKcal: Math.round(avg(totalKcal)),
      avgProteinG: Math.round(avg(totalProtein)),
      avgCarbsG: Math.round(avg(totalCarbs)),
      avgFatG: Math.round(avg(totalFat)),
      totalEntries,
      totalWorkouts: wo.total,
      totalWorkoutMinutes: wo.totalMin,
      totalKcalBurned: wo.totalKcal,
      topFoods: topRows.map((r) => ({ name: r.name, count: r.count })),
      firstLoggedAt,
    };
    return response;
  });

  fastify.post('/onboarding', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const body = OnboardingSchema.parse(req.body);

    const targets = calculateTargets({
      sex: body.sex,
      birthdate: body.birthdate,
      heightCm: body.heightCm,
      weightKg: body.weightKg,
      activities: body.activities,
      goal: body.goal,
      goalRateKgPerWeek: body.goalRateKgPerWeek,
    });

    await db
      .insert(profiles)
      .values({
        userId: req.user.id,
        sex: body.sex,
        birthdate: body.birthdate,
        heightCm: body.heightCm,
        weightKg: body.weightKg.toFixed(2),
        activities: body.activities,
        goal: body.goal,
        goalRateKgWk: body.goalRateKgPerWeek.toFixed(2),
        dailyKcal: targets.dailyKcal,
        dailyProteinG: targets.dailyProteinG,
        dailyCarbsG: targets.dailyCarbsG,
        dailyFatG: targets.dailyFatG,
        units: body.units,
        timezone: body.timezone,
        onboardedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          sex: body.sex,
          birthdate: body.birthdate,
          heightCm: body.heightCm,
          weightKg: body.weightKg.toFixed(2),
          activities: body.activities,
          goal: body.goal,
          goalRateKgWk: body.goalRateKgPerWeek.toFixed(2),
          dailyKcal: targets.dailyKcal,
          dailyProteinG: targets.dailyProteinG,
          dailyCarbsG: targets.dailyCarbsG,
          dailyFatG: targets.dailyFatG,
          units: body.units,
          timezone: body.timezone,
          onboardedAt: new Date(),
        },
      });

    return { ok: true, targets };
  });

  fastify.patch('/goals', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const body = ProfileTargets.parse(req.body);
    await db
      .update(profiles)
      .set({
        dailyKcal: body.dailyKcal,
        dailyProteinG: body.dailyProteinG,
        dailyCarbsG: body.dailyCarbsG,
        dailyFatG: body.dailyFatG,
      })
      .where(eq(profiles.userId, req.user.id));
    return { ok: true };
  });
}
