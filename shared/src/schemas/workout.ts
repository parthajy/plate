import { z } from 'zod';

export const WorkoutType = z.enum([
  'gym',
  'run',
  'cycle',
  'swim',
  'sports',
  'yoga',
  'walk',
  'other',
]);
export type WorkoutType = z.infer<typeof WorkoutType>;

export const WorkoutSource = z.enum(['manual', 'healthkit', 'googlefit', 'strava']);
export type WorkoutSource = z.infer<typeof WorkoutSource>;

export const LogWorkoutSchema = z.object({
  type: WorkoutType,
  durationMin: z.number().int().min(1).max(600),
  notes: z.string().trim().max(500).optional(),
  // Override the auto-estimate if the user knows the actual figure.
  kcalBurned: z.number().int().min(0).max(5000).optional(),
  distanceKm: z.number().min(0).max(500).optional(),
  startedAt: z.string().datetime().optional(),
  source: WorkoutSource.default('manual'),
});
export type LogWorkoutInput = z.infer<typeof LogWorkoutSchema>;

export const WorkoutEntry = z.object({
  id: z.string().uuid(),
  type: WorkoutType,
  durationMin: z.number().int(),
  kcalBurned: z.number().int(),
  distanceKm: z.number().nullable(),
  notes: z.string().nullable(),
  startedAt: z.string().datetime(),
  source: WorkoutSource,
});
export type WorkoutEntry = z.infer<typeof WorkoutEntry>;

export const WorkoutsListResponse = z.object({
  date: z.string(),
  workouts: z.array(WorkoutEntry),
  totals: z.object({
    durationMin: z.number().int(),
    kcalBurned: z.number().int(),
  }),
});
export type WorkoutsListResponse = z.infer<typeof WorkoutsListResponse>;
