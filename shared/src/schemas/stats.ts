import { z } from 'zod';

export const StatsWindow = z.enum(['7d', '30d', '90d', 'all']);
export type StatsWindow = z.infer<typeof StatsWindow>;

export const TopFood = z.object({
  name: z.string(),
  count: z.number().int(),
});
export type TopFood = z.infer<typeof TopFood>;

export const StatsResponse = z.object({
  window: StatsWindow,
  windowDays: z.number().int(),
  daysLogged: z.number().int(),
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
  avgKcal: z.number(),
  avgProteinG: z.number(),
  avgCarbsG: z.number(),
  avgFatG: z.number(),
  totalEntries: z.number().int(),
  totalWorkouts: z.number().int(),
  totalWorkoutMinutes: z.number().int(),
  totalKcalBurned: z.number().int(),
  topFoods: z.array(TopFood),
  firstLoggedAt: z.string().datetime().nullable(),
});
export type StatsResponse = z.infer<typeof StatsResponse>;
