import { z } from 'zod';

export const Sex = z.enum(['m', 'f', 'x']);
export type Sex = z.infer<typeof Sex>;

export const Activity = z.enum(['gym', 'run', 'cycle', 'swim', 'sports', 'yoga']);
export type Activity = z.infer<typeof Activity>;

export const Goal = z.enum(['lose', 'maintain', 'gain', 'recomp']);
export type Goal = z.infer<typeof Goal>;

export const Units = z.enum(['metric', 'imperial']);
export type Units = z.infer<typeof Units>;

export const OnboardingSchema = z.object({
  sex: Sex,
  // Optional: App Store guideline 5.1.1(v) — age isn't strictly required to
  // run the app. When absent, the BMR calc falls back to a default age.
  birthdate: z.string().date().optional(),
  heightCm: z.number().int().min(80).max(260),
  weightKg: z.number().min(25).max(400),
  activities: z.array(Activity).min(1).max(6),
  goal: Goal,
  goalRateKgPerWeek: z.number().min(0).max(1.5),
  units: Units.default('metric'),
  timezone: z.string().min(1),
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export const ProfileTargets = z.object({
  dailyKcal: z.number().int().min(1000).max(6000),
  dailyProteinG: z.number().int().min(0).max(500),
  dailyCarbsG: z.number().int().min(0).max(800),
  dailyFatG: z.number().int().min(0).max(300),
});
export type ProfileTargets = z.infer<typeof ProfileTargets>;

// Partial-update for the You / Settings screens. Any combination of fields
// can be sent; the backend recomputes targets when a body-composition field
// changes (unless keepTargets is set).
export const ProfilePatchSchema = z.object({
  displayName: z.string().trim().min(1).max(64).optional(),
  sex: Sex.optional(),
  birthdate: z.string().date().optional(),
  heightCm: z.number().int().min(80).max(260).optional(),
  weightKg: z.number().min(25).max(400).optional(),
  activities: z.array(Activity).min(1).max(6).optional(),
  goal: Goal.optional(),
  goalRateKgPerWeek: z.number().min(0).max(1.5).optional(),
  units: Units.optional(),
  keepTargets: z.boolean().optional(),
});
export type ProfilePatchInput = z.infer<typeof ProfilePatchSchema>;
