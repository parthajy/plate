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
  birthdate: z.string().date(),
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
