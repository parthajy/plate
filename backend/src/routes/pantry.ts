import type { FastifyInstance } from 'fastify';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  AddPantryItemSchema,
  RecipeRequestSchema,
  type PantryListResponse,
  type RecipeResponse,
} from '@plate/shared';
import { db } from '../db/client.js';
import { pantryItems } from '../db/schema.js';
import { AppError, NotFoundError, UnauthorizedError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth-middleware.js';
import { generateRecipe } from '../services/ai/recipe.js';

export async function pantryRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/items', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const rows = await db
      .select()
      .from(pantryItems)
      .where(eq(pantryItems.userId, req.user.id))
      .orderBy(asc(pantryItems.addedAt));
    const response: PantryListResponse = {
      items: rows.map((r) => ({
        id: r.id,
        ingredient: r.ingredient,
        addedAt: r.addedAt.toISOString(),
      })),
    };
    return response;
  });

  fastify.post('/items', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    const body = AddPantryItemSchema.parse(req.body);
    // Normalize: trim already done by Zod; lower-case so "Chicken" and
    // "chicken" don't both exist for the same user.
    const ingredient = body.ingredient.toLowerCase();

    const inserted = await db
      .insert(pantryItems)
      .values({ userId: req.user.id, ingredient })
      .onConflictDoNothing()
      .returning({
        id: pantryItems.id,
        ingredient: pantryItems.ingredient,
        addedAt: pantryItems.addedAt,
      });

    // If the unique conflict fired, fetch the existing row so we return a stable id.
    let row = inserted[0];
    if (!row) {
      const found = await db
        .select({
          id: pantryItems.id,
          ingredient: pantryItems.ingredient,
          addedAt: pantryItems.addedAt,
        })
        .from(pantryItems)
        .where(and(eq(pantryItems.userId, req.user.id), eq(pantryItems.ingredient, ingredient)))
        .limit(1);
      row = found[0];
    }
    if (!row) throw new AppError('PANTRY_INSERT_FAILED', 'Could not add ingredient', 500);

    return reply.code(201).send({
      id: row.id,
      ingredient: row.ingredient,
      addedAt: row.addedAt.toISOString(),
    });
  });

  fastify.delete<{ Params: { id: string } }>('/items/:id', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    const id = z.string().uuid().parse(req.params.id);
    const deleted = await db
      .delete(pantryItems)
      .where(and(eq(pantryItems.id, id), eq(pantryItems.userId, req.user.id)))
      .returning({ id: pantryItems.id });
    if (deleted.length === 0) throw new NotFoundError('pantry item');
    return reply.code(204).send();
  });

  fastify.post('/recipe', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    const body = RecipeRequestSchema.parse(req.body ?? {});

    const rows = await db
      .select({ ingredient: pantryItems.ingredient })
      .from(pantryItems)
      .where(eq(pantryItems.userId, req.user.id));
    const pantry = rows.map((r) => r.ingredient);

    const t0 = Date.now();
    const recipe = await generateRecipe(req.user.id, pantry, body.filters);
    req.log.info(
      {
        userId: req.user.id,
        pantrySize: pantry.length,
        latencyMs: Date.now() - t0,
        recipeTitle: recipe.title,
      },
      'recipe generated',
    );

    const response: RecipeResponse = { recipe };
    return reply.code(200).send(response);
  });
}
