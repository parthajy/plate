import type { FastifyInstance } from 'fastify';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  AddPantryItemSchema,
  RecipeRequestSchema,
  type PantryListResponse,
  type SavedRecipe,
  type SavedRecipeListResponse,
  type SavedRecipeResponse,
} from '@plate/shared';
import { db } from '../db/client.js';
import { pantryItems, recipes } from '../db/schema.js';
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

    // Persist so the user can revisit. Best-effort — if the insert fails the
    // user still gets the recipe back, they just lose history for that one.
    let saved: SavedRecipe | null = null;
    try {
      const inserted = await db
        .insert(recipes)
        .values({
          userId: req.user.id,
          title: recipe.title,
          description: recipe.description ?? null,
          servings: recipe.servings,
          totalMinutes: recipe.totalMinutes,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          macrosPerServing: recipe.macrosPerServing,
          pantryUsed: recipe.pantryUsed,
          missing: recipe.missing,
        })
        .returning({ id: recipes.id, createdAt: recipes.createdAt });
      const row = inserted[0];
      if (row) {
        saved = { ...recipe, id: row.id, createdAt: row.createdAt.toISOString() };
      }
    } catch (err) {
      req.log.warn({ err, userId: req.user.id }, 'recipe persist failed');
    }

    req.log.info(
      {
        userId: req.user.id,
        pantrySize: pantry.length,
        latencyMs: Date.now() - t0,
        recipeTitle: recipe.title,
        recipeId: saved?.id ?? null,
      },
      'recipe generated',
    );

    // Send the saved shape (with id/createdAt) if we persisted; otherwise
    // synthesize an unpersisted shape so mobile can still display it.
    const response: SavedRecipeResponse = {
      recipe:
        saved ??
        ({
          ...recipe,
          id: '00000000-0000-0000-0000-000000000000',
          createdAt: new Date().toISOString(),
        } as SavedRecipe),
    };
    return reply.code(200).send(response);
  });

  // List the user's saved recipes, newest first. No pagination yet — when a
  // user racks up 200+ generated recipes we'll add ?cursor=, but we're nowhere
  // near that.
  fastify.get('/recipes', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const rows = await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, req.user.id))
      .orderBy(desc(recipes.createdAt))
      .limit(200);

    const response: SavedRecipeListResponse = {
      recipes: rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? undefined,
        servings: r.servings,
        totalMinutes: r.totalMinutes,
        ingredients: r.ingredients as SavedRecipe['ingredients'],
        steps: r.steps as SavedRecipe['steps'],
        macrosPerServing: r.macrosPerServing as SavedRecipe['macrosPerServing'],
        pantryUsed: (r.pantryUsed as string[]) ?? [],
        missing: (r.missing as string[]) ?? [],
        createdAt: r.createdAt.toISOString(),
      })),
    };
    return response;
  });

  // Single recipe by id, scoped to the requesting user (404 if not theirs).
  fastify.get<{ Params: { id: string } }>('/recipes/:id', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const id = z.string().uuid().parse(req.params.id);
    const rows = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), eq(recipes.userId, req.user.id)))
      .limit(1);
    const r = rows[0];
    if (!r) throw new NotFoundError('recipe');

    const response: SavedRecipeResponse = {
      recipe: {
        id: r.id,
        title: r.title,
        description: r.description ?? undefined,
        servings: r.servings,
        totalMinutes: r.totalMinutes,
        ingredients: r.ingredients as SavedRecipe['ingredients'],
        steps: r.steps as SavedRecipe['steps'],
        macrosPerServing: r.macrosPerServing as SavedRecipe['macrosPerServing'],
        pantryUsed: (r.pantryUsed as string[]) ?? [],
        missing: (r.missing as string[]) ?? [],
        createdAt: r.createdAt.toISOString(),
      },
    };
    return response;
  });
}
