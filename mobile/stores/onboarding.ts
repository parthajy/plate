import { create } from 'zustand';
import type { Activity, Goal, Sex, Units } from '@plate/shared';

export interface OnboardingDraft {
  sex?: Sex;
  birthdate?: string | undefined; // YYYY-MM-DD, optional
  heightCm?: number;
  weightKg?: number;
  activities: Activity[];
  goal?: Goal;
  goalRateKgPerWeek?: number;
  units: Units;
  // Targets (after server returns or user overrides)
  dailyKcal?: number;
  dailyProteinG?: number;
  dailyCarbsG?: number;
  dailyFatG?: number;
}

interface OnboardingState extends OnboardingDraft {
  set: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
}

const INITIAL: OnboardingDraft = {
  activities: [],
  units: 'metric',
};

export const useOnboarding = create<OnboardingState>((set) => ({
  ...INITIAL,
  set: (patch) => set(patch),
  reset: () => set(INITIAL),
}));
