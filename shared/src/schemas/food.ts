import { z } from 'zod';

export const MealType = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export type MealType = z.infer<typeof MealType>;

export const FoodLogSource = z.enum(['manual', 'scan', 'barcode', 'recipe']);
export type FoodLogSource = z.infer<typeof FoodLogSource>;

export const LogFoodSchema = z.object({
  foodId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  grams: z.number().positive().max(5000),
  kcal: z.number().nonnegative().max(15000),
  proteinG: z.number().nonnegative().max(500),
  carbsG: z.number().nonnegative().max(1500),
  fatG: z.number().nonnegative().max(500),
  mealType: MealType,
  loggedAt: z.string().datetime(),
  source: FoodLogSource.default('manual'),
  notes: z.string().max(500).optional(),
  scanImageUrl: z.string().url().max(2000).optional(),
  scanConfidence: z.number().min(0).max(1).optional(),
});
export type LogFoodInput = z.infer<typeof LogFoodSchema>;

export const ScanResultSchema = z.object({
  foodName: z.string().min(1).max(120),
  brand: z.string().max(120).nullish(),
  portionGrams: z.number().positive().max(5000),
  kcal: z.number().nonnegative().max(15000),
  proteinG: z.number().nonnegative().max(500),
  carbsG: z.number().nonnegative().max(1500),
  fatG: z.number().nonnegative().max(500),
  confidence: z.number().min(0).max(1),
  notes: z.string().max(500).nullish(),
});
export type ScanResult = z.infer<typeof ScanResultSchema>;

export const ScanResponseSchema = z.object({
  imageUrl: z.string().url(),
  result: ScanResultSchema,
});
export type ScanResponse = z.infer<typeof ScanResponseSchema>;

export const ScanRequestSchema = z.object({
  // Client-side compressed JPEG (max ~1024px, q~0.6) sent as base64.
  // The server caps at ~3MB after base64-decode to keep memory bounded.
  imageBase64: z.string().min(64).max(5_000_000),
  contentType: z.enum(['image/jpeg', 'image/png']).default('image/jpeg'),
});
export type ScanRequest = z.infer<typeof ScanRequestSchema>;
