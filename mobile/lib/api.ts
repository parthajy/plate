import Constants from 'expo-constants';
import type { TokenPair } from '@plate/shared';
import { loadTokens, saveTokens, clearTokens } from './secure-storage';

const DEFAULT_LOCAL =
  // Android emulator → host machine
  // iOS Simulator → localhost works
  // Physical device → set EXPO_PUBLIC_API_URL on your machine
  'http://localhost:3000';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  DEFAULT_LOCAL;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  constructor(status: number, code: string, message: string, details: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
interface RequestInit {
  method?: Method;
  body?: unknown;
  auth?: boolean; // default true; set false for /v1/auth/*
  signal?: AbortSignal;
}

let inMemoryTokens: TokenPair | null = null;
let refreshInflight: Promise<TokenPair | null> | null = null;
let onUnauthenticated: (() => void) | null = null;

export function setUnauthenticatedHandler(fn: () => void): void {
  onUnauthenticated = fn;
}

export async function hydrateTokens(): Promise<TokenPair | null> {
  inMemoryTokens = await loadTokens();
  return inMemoryTokens;
}

export async function setTokens(t: TokenPair | null): Promise<void> {
  inMemoryTokens = t;
  if (t) await saveTokens(t);
  else await clearTokens();
}

export function getTokens(): TokenPair | null {
  return inMemoryTokens;
}

async function refresh(): Promise<TokenPair | null> {
  if (refreshInflight) return refreshInflight;
  const tokens = inMemoryTokens;
  if (!tokens?.refreshToken) return null;

  refreshInflight = (async () => {
    try {
      const res = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!res.ok) {
        await setTokens(null);
        onUnauthenticated?.();
        return null;
      }
      const next = (await res.json()) as TokenPair;
      await setTokens(next);
      return next;
    } catch {
      return null;
    } finally {
      refreshInflight = null;
    }
  })();

  return refreshInflight;
}

async function doFetch<T>(path: string, init: RequestInit, attempt = 0): Promise<T> {
  // Only set Content-Type when we actually send a body. Fastify rejects
  // requests that claim Content-Type: application/json with an empty body
  // (FST_ERR_CTP_EMPTY_JSON_BODY → 500), which was breaking every DELETE
  // in the app (pantry item remove, account delete, etc.).
  const hasBody = init.body !== undefined;
  const headers: Record<string, string> = {};
  if (hasBody) headers['Content-Type'] = 'application/json';
  const useAuth = init.auth !== false;
  if (useAuth && inMemoryTokens?.accessToken) {
    headers.Authorization = `Bearer ${inMemoryTokens.accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: init.method ?? 'GET',
    headers,
    ...(hasBody ? { body: JSON.stringify(init.body) } : {}),
    ...(init.signal ? { signal: init.signal } : {}),
  });

  if (res.status === 401 && useAuth && attempt === 0) {
    const next = await refresh();
    if (next) return doFetch<T>(path, init, attempt + 1);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON; leave undefined
    }
  }

  if (!res.ok) {
    const errBody = (json as { error?: { code?: string; message?: string } } | undefined)?.error;
    throw new ApiError(
      res.status,
      errBody?.code ?? 'HTTP_ERROR',
      errBody?.message ?? res.statusText,
      json,
    );
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, init: Omit<RequestInit, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init: Omit<RequestInit, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...init, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, init: Omit<RequestInit, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...init, method: 'PATCH', body }),
  delete: <T>(path: string, init: Omit<RequestInit, 'method' | 'body'> = {}) =>
    doFetch<T>(path, { ...init, method: 'DELETE' }),
};
