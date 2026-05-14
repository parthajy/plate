import { z } from 'zod';

export const MealType = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export type MealType = z.infer<typeof MealType>;

export const FoodLogSource = z.enum(['manual', 'scan', 'barcode', 'recipe']);
export type FoodLogSource = z.infer<typeof FoodLogSource>;

export const LogFoodSchema = z.object({
  foodId: z.string().uuid().optional(),
  grams: z.number().positive().max(5000),
  kcal: z.number().nonnegative().max(15000),
  proteinG: z.number().nonnegative().max(500),
  carbsG: z.number().nonnegative().max(1500),
  fatG: z.number().nonnegative().max(500),
  mealType: MealType,
  loggedAt: z.string().datetime(),
  source: FoodLogSource.default('manual'),
  notes: z.string().max(500).optional(),
});
export type LogFoodInput = z.infer<typeof LogFoodSchema>;

export const ScanResultSchema = z.object({
  foodName: z.string(),
  brand: z.string().optional(),
  portionGrams: z.number().positive(),
  kcal: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});
export type ScanResult = z.infer<typeof ScanResultSchema>;
