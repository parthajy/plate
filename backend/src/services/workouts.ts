import type { WorkoutType } from '@plate/shared';

// Conservative MET values from the Compendium of Physical Activities.
// Intentionally on the low side — overcounting "calories out" damages the
// trust users have in the app's calorie math.
const MET: Record<WorkoutType, number> = {
  gym: 5.0, // general strength training, mixed pace
  run: 9.8, // ~9.5 km/h jog
  cycle: 7.5, // moderate outdoor cycling
  swim: 8.0, // freestyle, moderate
  sports: 7.0, // football, basketball
  yoga: 3.0,
  walk: 3.5, // brisk
  other: 5.0,
};

const DEFAULT_WEIGHT_KG = 75;

export function estimateKcal(
  type: WorkoutType,
  durationMin: number,
  weightKg: number | null | undefined,
): number {
  const met = MET[type];
  const w = weightKg && weightKg > 25 ? weightKg : DEFAULT_WEIGHT_KG;
  const kcal = met * w * (durationMin / 60);
  return Math.round(kcal);
}
