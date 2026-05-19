import { z } from 'zod';

export const PantryItem = z.object({
  id: z.string().uuid(),
  ingredient: z.string(),
  addedAt: z.string().datetime(),
});
export type PantryItem = z.infer<typeof PantryItem>;

export const PantryListResponse = z.object({
  items: z.array(PantryItem),
});
export type PantryListResponse = z.infer<typeof PantryListResponse>;

export const AddPantryItemSchema = z.object({
  ingredient: z.string().trim().min(1).max(80),
});
export type AddPantryItemInput = z.infer<typeof AddPantryItemSchema>;

export const RecipeFilters = z.object({
  maxMinutes: z.number().int().min(5).max(180).optional(),
  highProtein: z.boolean().optional(),
  lowCarb: z.boolean().optional(),
  vegetarian: z.boolean().optional(),
});
export type RecipeFilters = z.infer<typeof RecipeFilters>;

export const RecipeRequestSchema = z.object({
  filters: RecipeFilters.optional(),
});
export type RecipeRequest = z.infer<typeof RecipeRequestSchema>;

export const RecipeIngredient = z.object({
  name: z.string().min(1).max(80),
  grams: z.number().nonnegative().max(5000),
  optional: z.boolean().optional(),
});
export type RecipeIngredient = z.infer<typeof RecipeIngredient>;

export const Recipe = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(280).optional(),
  servings: z.number().int().min(1).max(12),
  totalMinutes: z.number().int().min(1).max(240),
  ingredients: z.array(RecipeIngredient).min(1).max(30),
  steps: z.array(z.string().min(1).max(500)).min(1).max(20),
  macrosPerServing: z.object({
    kcal: z.number().nonnegative().max(3000),
    proteinG: z.number().nonnegative().max(200),
    carbsG: z.number().nonnegative().max(400),
    fatG: z.number().nonnegative().max(200),
  }),
  pantryUsed: z.array(z.string()).default([]),
  missing: z.array(z.string()).default([]),
});
export type Recipe = z.infer<typeof Recipe>;

export const RecipeResponseSchema = z.object({
  recipe: Recipe,
});
export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;

// Persisted recipe — server stamps id + createdAt on top of the AI's output.
export const SavedRecipe = Recipe.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type SavedRecipe = z.infer<typeof SavedRecipe>;

export const SavedRecipeListResponse = z.object({
  recipes: z.array(SavedRecipe),
});
export type SavedRecipeListResponse = z.infer<typeof SavedRecipeListResponse>;

export const SavedRecipeResponse = z.object({
  recipe: SavedRecipe,
});
export type SavedRecipeResponse = z.infer<typeof SavedRecipeResponse>;
