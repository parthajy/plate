import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { calculateTargets, OnboardingSchema, ProfileTargets } from '@plate/shared';
import { db } from '../db/client.js';
import { profiles, users } from '../db/schema.js';
import { UnauthorizedError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth-middleware.js';

const PatchProfileSchema = z.object({
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
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    const row = rows[0];
    if (!row) throw new UnauthorizedError('User no longer exists');
    return row;
  });

  fastify.patch('/', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const body = PatchProfileSchema.parse(req.body);
    if (body.displayName !== undefined) {
      await db
        .update(users)
        .set({ displayName: body.displayName, updatedAt: new Date() })
        .where(eq(users.id, req.user.id));
    }
    return { ok: true };
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
