import { create } from 'zustand';
import type { TokenPair } from '@plate/shared';
import { api, ApiError, hydrateTokens, setTokens, setUnauthenticatedHandler } from '../lib/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface MeResponse {
  id: string;
  email: string;
  displayName: string | null;
  onboardedAt: string | null;
  // Profile fields (null until onboarding is complete)
  sex: string | null;
  birthdate: string | null;
  heightCm: number | null;
  weightKg: string | null;
  activities: string[] | null;
  goal: string | null;
  dailyKcal: number | null;
  dailyProteinG: number | null;
  dailyCarbsG: number | null;
  dailyFatG: number | null;
  units: string | null;
  timezone: string | null;
}

interface AuthState {
  status: AuthStatus;
  user: MeResponse | null;
  hydrate: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,

  hydrate: async () => {
    const tokens = await hydrateTokens();
    if (!tokens) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    try {
      const me = await api.get<MeResponse>('/v1/me');
      set({ status: 'authenticated', user: me });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await setTokens(null);
        set({ status: 'unauthenticated', user: null });
      } else {
        // Network blip — stay unauthenticated for safety. User can retry.
        set({ status: 'unauthenticated', user: null });
      }
    }
  },

  signUp: async (email, password, displayName) => {
    const issued = await api.post<TokenPair>(
      '/v1/auth/signup',
      { email, password, ...(displayName ? { displayName } : {}) },
      { auth: false },
    );
    await setTokens(issued);
    const me = await api.get<MeResponse>('/v1/me');
    set({ status: 'authenticated', user: me });
  },

  signIn: async (email, password) => {
    const issued = await api.post<TokenPair>(
      '/v1/auth/login',
      { email, password },
      { auth: false },
    );
    await setTokens(issued);
    const me = await api.get<MeResponse>('/v1/me');
    set({ status: 'authenticated', user: me });
  },

  signOut: async () => {
    const tokens = await hydrateTokens();
    if (tokens?.refreshToken) {
      await api
        .post('/v1/auth/logout', { refreshToken: tokens.refreshToken }, { auth: false })
        .catch(() => {});
    }
    await setTokens(null);
    set({ status: 'unauthenticated', user: null });
  },

  refreshMe: async () => {
    const me = await api.get<MeResponse>('/v1/me');
    set({ user: me });
  },
}));

// When the API client gives up refreshing, drop into unauthenticated.
setUnauthenticatedHandler(() => {
  useAuth.setState({ status: 'unauthenticated', user: null });
});

export function isAuthenticated(): boolean {
  return useAuth.getState().status === 'authenticated';
}
