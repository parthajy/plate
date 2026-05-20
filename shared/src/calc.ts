import type { Activity, Goal, Sex } from './schemas/profile.js';

// Mifflin-St Jeor BMR.
export function bmr(input: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  switch (input.sex) {
    case 'm':
      return base + 5;
    case 'f':
      return base - 161;
    case 'x':
      // Average of the two so we don't ship a worse estimate.
      return base - 78;
  }
}

// Activity multiplier derived from selected activities. We take the *peak*
// multiplier across selections — someone who lifts and runs deserves the
// higher floor, not the average.
const ACTIVITY_MULT: Record<Activity, number> = {
  yoga: 1.4,
  gym: 1.55,
  sports: 1.6,
  cycle: 1.65,
  swim: 1.65,
  run: 1.7,
};

export function activityMultiplier(activities: readonly Activity[]): number {
  if (activities.length === 0) return 1.3;
  return Math.max(...activities.map((a) => ACTIVITY_MULT[a]));
}

export function ageYears(birthdate: string, today: Date = new Date()): number {
  const b = new Date(birthdate);
  let years = today.getUTCFullYear() - b.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - b.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < b.getUTCDate())) {
    years -= 1;
  }
  return years;
}

const KCAL_PER_KG_BODYWEIGHT = 7700;

// Used when the user skips date of birth (it's optional — see guideline
// 5.1.1(v)). Age's weight in Mifflin-St Jeor is small (−5 kcal/year), so a
// 30-year-old midpoint keeps the estimate within ~100 kcal for most adults.
const DEFAULT_AGE_YEARS = 30;

export interface TargetsInput {
  sex: Sex;
  birthdate?: string | undefined;
  heightCm: number;
  weightKg: number;
  activities: readonly Activity[];
  goal: Goal;
  goalRateKgPerWeek: number;
}

export interface Targets {
  dailyKcal: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
  tdee: number;
}

export function calculateTargets(input: TargetsInput): Targets {
  const age = input.birthdate ? ageYears(input.birthdate) : DEFAULT_AGE_YEARS;
  const restingBmr = bmr({
    sex: input.sex,
    weightKg: input.weightKg,
    heightCm: input.heightCm,
    ageYears: age,
  });
  const tdee = restingBmr * activityMultiplier(input.activities);

  let goalAdjust = 0;
  switch (input.goal) {
    case 'lose':
      goalAdjust = -(input.goalRateKgPerWeek * KCAL_PER_KG_BODYWEIGHT) / 7;
      break;
    case 'gain':
      goalAdjust = (input.goalRateKgPerWeek * KCAL_PER_KG_BODYWEIGHT) / 7;
      break;
    case 'recomp':
      goalAdjust = -200;
      break;
    case 'maintain':
      goalAdjust = 0;
      break;
  }

  // Don't dip below 1200 kcal — that's the floor any responsible app should keep.
  const dailyKcal = Math.max(1200, Math.round((tdee + goalAdjust) / 10) * 10);

  // Macro split per DESIGN: 1.6 g/kg protein, ~28% fat, remainder carbs.
  const proteinG = Math.round(input.weightKg * 1.6);
  const fatG = Math.round((dailyKcal * 0.28) / 9);
  const remainingKcal = dailyKcal - proteinG * 4 - fatG * 9;
  const carbsG = Math.max(50, Math.round(remainingKcal / 4));

  return {
    dailyKcal,
    dailyProteinG: proteinG,
    dailyCarbsG: carbsG,
    dailyFatG: fatG,
    tdee: Math.round(tdee),
  };
}
