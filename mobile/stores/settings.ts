import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsState {
  notificationsEnabled: boolean;
  themeMode: ThemeMode;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setNotificationsEnabled: (v: boolean) => Promise<void>;
  setThemeMode: (m: ThemeMode) => Promise<void>;
}

const STORAGE_KEY = 'plate.settings.v1';

interface PersistedShape {
  notificationsEnabled: boolean;
  themeMode: ThemeMode;
}

async function persist(state: PersistedShape): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // best-effort
  }
}

export const useSettings = create<SettingsState>((set, get) => ({
  notificationsEnabled: true,
  themeMode: 'system',
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedShape>;
        set({
          notificationsEnabled: parsed.notificationsEnabled ?? true,
          themeMode: parsed.themeMode ?? 'system',
          hydrated: true,
        });
        return;
      }
    } catch {
      // fall through
    }
    set({ hydrated: true });
  },

  setNotificationsEnabled: async (v) => {
    set({ notificationsEnabled: v });
    await persist({
      notificationsEnabled: v,
      themeMode: get().themeMode,
    });
  },

  setThemeMode: async (m) => {
    set({ themeMode: m });
    await persist({
      notificationsEnabled: get().notificationsEnabled,
      themeMode: m,
    });
  },
}));

export function getSettingsSnapshot(): PersistedShape {
  const s = useSettings.getState();
  return { notificationsEnabled: s.notificationsEnabled, themeMode: s.themeMode };
}
