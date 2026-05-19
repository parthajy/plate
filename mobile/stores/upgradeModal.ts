import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

// Reasons let the modal headline vary by context ("you hit your cap" vs
// "unlock more recipes"). The body + plans + CTA stay identical so the
// modal feels like one consistent piece of UI across the app.
export type UpgradeReason =
  | 'manual' // user tapped an Upgrade button
  | 'first-recipe-of-day' // soft nudge after the day's first generation
  | 'recipe-cap' // free user tried a 2nd recipe today
  | 'scan-cap'
  | 'coach-cap';

type State = {
  visible: boolean;
  reason: UpgradeReason;
  show: (reason?: UpgradeReason) => void;
  hide: () => void;
  softShow: (reason: UpgradeReason) => Promise<void>;
};

const SOFT_SHOW_KEY = '@plate/upgradeModalLastShown';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useUpgradeModal = create<State>((set, get) => ({
  visible: false,
  reason: 'manual',
  show: (reason = 'manual') => set({ visible: true, reason }),
  hide: () => set({ visible: false }),
  softShow: async (reason) => {
    if (get().visible) return;
    const last = await AsyncStorage.getItem(SOFT_SHOW_KEY);
    if (last === todayKey()) return;
    await AsyncStorage.setItem(SOFT_SHOW_KEY, todayKey());
    set({ visible: true, reason });
  },
}));
