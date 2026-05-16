import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { and, desc, eq, gte, lt, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';
import {
  LogFoodSchema,
  ScanRequestSchema,
  ScanResultSchema,
  type ScanResponse,
} from '@plate/shared';
import { db } from '../db/client.js';
import { foodLogs, foods, scanCache } from '../db/schema.js';
import { AppError, NotFoundError, UnauthorizedError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth-middleware.js';
import { uploadFoodScan } from '../services/storage.js';
import { analyzeFoodImage } from '../services/ai/vision.js';

const SCAN_CACHE_TTL_HOURS = 24;

const SearchQuery = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const ListLogsQuery = z.object({
  // YYYY-MM-DD; interpreted in UTC for v1. Timezone-aware filtering is a
  // post-Phase-1 refinement.
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function foodRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/search', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const params = SearchQuery.parse(req.query);
    const term = `%${params.q.trim()}%`;

    const rows = await db
      .select({
        id: foods.id,
        name: foods.name,
        brand: foods.brand,
        servingG: foods.servingG,
        kcalPer100g: foods.kcalPer100g,
        proteinPer100g: foods.proteinPer100g,
        carbsPer100g: foods.carbsPer100g,
        fatPer100g: foods.fatPer100g,
      })
      .from(foods)
      .where(ilike(foods.name, term))
      .orderBy(foods.name)
      .limit(params.limit);

    return { items: rows };
  });

  fastify.post('/log', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    const body = LogFoodSchema.parse(req.body);

    const inserted = await db
      .insert(foodLogs)
      .values({
        userId: req.user.id,
        ...(body.foodId ? { foodId: body.foodId } : {}),
        ...(body.name ? { customName: body.name } : {}),
        grams: body.grams.toString(),
        kcal: body.kcal.toString(),
        proteinG: body.proteinG.toString(),
        carbsG: body.carbsG.toString(),
        fatG: body.fatG.toString(),
        mealType: body.mealType,
        loggedAt: new Date(body.loggedAt),
        source: body.source,
        ...(body.notes ? { notes: body.notes } : {}),
        ...(body.scanImageUrl ? { scanImageUrl: body.scanImageUrl } : {}),
        ...(body.scanConfidence !== undefined
          ? { scanConfidence: body.scanConfidence.toString() }
          : {}),
      })
      .returning({ id: foodLogs.id });

    const row = inserted[0];
    if (!row) throw new AppError('LOG_FAILED', 'Could not save log entry', 500);
    return reply.code(201).send({ id: row.id });
  });

  fastify.get('/logs', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const params = ListLogsQuery.parse(req.query);
    const start = new Date(`${params.date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const rows = await db
      .select({
        id: foodLogs.id,
        foodId: foodLogs.foodId,
        name: foods.name,
        customName: foodLogs.customName,
        brand: foods.brand,
        grams: foodLogs.grams,
        kcal: foodLogs.kcal,
        proteinG: foodLogs.proteinG,
        carbsG: foodLogs.carbsG,
        fatG: foodLogs.fatG,
        mealType: foodLogs.mealType,
        loggedAt: foodLogs.loggedAt,
        source: foodLogs.source,
        notes: foodLogs.notes,
      })
      .from(foodLogs)
      .leftJoin(foods, eq(foods.id, foodLogs.foodId))
      .where(
        and(
          eq(foodLogs.userId, req.user.id),
          gte(foodLogs.loggedAt, start),
          lt(foodLogs.loggedAt, end),
        ),
      )
      .orderBy(desc(foodLogs.loggedAt));

    const totals = rows.reduce(
      (acc, r) => ({
        kcal: acc.kcal + Number(r.kcal),
        proteinG: acc.proteinG + Number(r.proteinG),
        carbsG: acc.carbsG + Number(r.carbsG),
        fatG: acc.fatG + Number(r.fatG),
      }),
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );

    return {
      date: params.date,
      logs: rows.map((r) => ({
        id: r.id,
        foodId: r.foodId,
        name: r.name ?? r.customName ?? 'Custom entry',
        brand: r.brand,
        grams: Number(r.grams),
        kcal: Number(r.kcal),
        proteinG: Number(r.proteinG),
        carbsG: Number(r.carbsG),
        fatG: Number(r.fatG),
        mealType: r.mealType,
        loggedAt: r.loggedAt.toISOString(),
        source: r.source,
        notes: r.notes,
      })),
      totals: {
        kcal: Math.round(totals.kcal),
        proteinG: Math.round(totals.proteinG),
        carbsG: Math.round(totals.carbsG),
        fatG: Math.round(totals.fatG),
      },
    };
  });

  fastify.post('/scan', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    const body = ScanRequestSchema.parse(req.body);

    let bytes: Buffer;
    try {
      bytes = Buffer.from(body.imageBase64, 'base64');
    } catch {
      throw new AppError('SCAN_INVALID_IMAGE', 'Image payload is not valid base64', 400);
    }
    if (bytes.byteLength < 1024) {
      throw new AppError('SCAN_INVALID_IMAGE', 'Image is too small to analyze', 400);
    }
    if (bytes.byteLength > 6 * 1024 * 1024) {
      throw new AppError('SCAN_INVALID_IMAGE', 'Image is too large; compress before upload', 413);
    }

    // Cache lookup before doing any Spaces upload or Vision call.
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
    const cutoff = new Date(Date.now() - SCAN_CACHE_TTL_HOURS * 60 * 60 * 1000);
    const cached = await db
      .select()
      .from(scanCache)
      .where(and(eq(scanCache.sha256, sha256), gte(scanCache.createdAt, cutoff)))
      .limit(1);

    if (cached[0]) {
      const parsed = ScanResultSchema.safeParse(cached[0].result);
      if (parsed.success) {
        req.log.info({ userId: req.user.id, sha256, source: 'cache' }, 'food scan hit cache');
        const response: ScanResponse = {
          imageUrl: cached[0].imageUrl,
          result: parsed.data,
        };
        return reply.code(200).send(response);
      }
      // Bad payload shape (older format) — fall through to recompute.
    }

    const stored = await uploadFoodScan(req.user.id, bytes, body.contentType);
    const result = await analyzeFoodImage(req.user.id, stored.url);

    // Cache for future scans of the exact same photo.
    await db
      .insert(scanCache)
      .values({ sha256, imageUrl: stored.url, result })
      .onConflictDoUpdate({
        target: scanCache.sha256,
        set: { imageUrl: stored.url, result, createdAt: new Date() },
      });

    req.log.info(
      { userId: req.user.id, key: stored.key, sha256, confidence: result.confidence },
      'food scan completed',
    );

    const response: ScanResponse = { imageUrl: stored.url, result };
    return reply.code(200).send(response);
  });

  fastify.delete<{ Params: { id: string } }>('/log/:id', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    const id = z.string().uuid().parse(req.params.id);
    const deleted = await db
      .delete(foodLogs)
      .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, req.user.id)))
      .returning({ id: foodLogs.id });
    if (deleted.length === 0) throw new NotFoundError('log entry');
    return reply.code(204).send();
  });

  // Used by the food log search modal to enrich a freshly-typed custom food
  // search result with a "create custom" option.
  fastify.get('/recent', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const rows = await db
      .selectDistinctOn([foodLogs.foodId], {
        id: foodLogs.foodId,
        name: foods.name,
        brand: foods.brand,
        kcal: foodLogs.kcal,
        proteinG: foodLogs.proteinG,
        carbsG: foodLogs.carbsG,
        fatG: foodLogs.fatG,
        loggedAt: foodLogs.loggedAt,
      })
      .from(foodLogs)
      .innerJoin(foods, eq(foods.id, foodLogs.foodId))
      .where(eq(foodLogs.userId, req.user.id))
      .orderBy(foodLogs.foodId, desc(foodLogs.loggedAt))
      .limit(20);

    return {
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        brand: r.brand,
        lastLoggedAt: r.loggedAt.toISOString(),
      })),
    };
  });

  // Day totals helper for the Today widget when only headline numbers needed.
  fastify.get('/totals', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const params = ListLogsQuery.parse(req.query);
    const start = new Date(`${params.date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const result = await db
      .select({
        kcal: sql<number>`coalesce(sum(${foodLogs.kcal}), 0)::float`,
        proteinG: sql<number>`coalesce(sum(${foodLogs.proteinG}), 0)::float`,
        carbsG: sql<number>`coalesce(sum(${foodLogs.carbsG}), 0)::float`,
        fatG: sql<number>`coalesce(sum(${foodLogs.fatG}), 0)::float`,
      })
      .from(foodLogs)
      .where(
        and(
          eq(foodLogs.userId, req.user.id),
          gte(foodLogs.loggedAt, start),
          lt(foodLogs.loggedAt, end),
        ),
      );

    const row = result[0] ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
    return {
      kcal: Math.round(row.kcal),
      proteinG: Math.round(row.proteinG),
      carbsG: Math.round(row.carbsG),
      fatG: Math.round(row.fatG),
    };
  });
}
