import type { FastifyInstance } from 'fastify';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import { z } from 'zod';
import {
  LogWorkoutSchema,
  type WorkoutSource,
  type WorkoutType,
  type WorkoutsListResponse,
} from '@plate/shared';
import { db } from '../db/client.js';
import { profiles, workouts } from '../db/schema.js';
import { AppError, NotFoundError, UnauthorizedError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth-middleware.js';
import { estimateKcal } from '../services/workouts.js';

const ListQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function workoutRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const params = ListQuery.parse(req.query);
    const start = new Date(`${params.date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const rows = await db
      .select()
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, req.user.id),
          gte(workouts.startedAt, start),
          lt(workouts.startedAt, end),
        ),
      )
      .orderBy(desc(workouts.startedAt));

    const totalDuration = rows.reduce((acc, r) => acc + (r.durationMin ?? 0), 0);
    const totalKcal = rows.reduce((acc, r) => acc + (r.kcalBurned ?? 0), 0);

    const response: WorkoutsListResponse = {
      date: params.date,
      workouts: rows.map((r) => ({
        id: r.id,
        type: r.type as WorkoutType,
        durationMin: r.durationMin ?? 0,
        kcalBurned: r.kcalBurned ?? 0,
        distanceKm: r.distanceKm ? Number(r.distanceKm) : null,
        notes: r.notes,
        startedAt: r.startedAt.toISOString(),
        source: r.source as WorkoutSource,
      })),
      totals: { durationMin: totalDuration, kcalBurned: totalKcal },
    };
    return response;
  });

  fastify.post('/', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    const body = LogWorkoutSchema.parse(req.body);

    // Load weight for kcal estimate if user didn't override.
    let kcal = body.kcalBurned;
    if (kcal == null) {
      const prof = await db
        .select({ weightKg: profiles.weightKg })
        .from(profiles)
        .where(eq(profiles.userId, req.user.id))
        .limit(1);
      const w = prof[0]?.weightKg ? Number(prof[0].weightKg) : null;
      kcal = estimateKcal(body.type, body.durationMin, w);
    }

    const inserted = await db
      .insert(workouts)
      .values({
        userId: req.user.id,
        type: body.type,
        durationMin: body.durationMin,
        kcalBurned: kcal,
        ...(body.distanceKm != null ? { distanceKm: body.distanceKm.toString() } : {}),
        ...(body.notes ? { notes: body.notes } : {}),
        startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
        source: body.source,
      })
      .returning({ id: workouts.id });
    const row = inserted[0];
    if (!row) throw new AppError('WORKOUT_INSERT_FAILED', 'Could not log workout', 500);

    return reply.code(201).send({ id: row.id, kcalBurned: kcal });
  });

  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    const id = z.string().uuid().parse(req.params.id);
    const deleted = await db
      .delete(workouts)
      .where(and(eq(workouts.id, id), eq(workouts.userId, req.user.id)))
      .returning({ id: workouts.id });
    if (deleted.length === 0) throw new NotFoundError('workout');
    return reply.code(204).send();
  });
}
