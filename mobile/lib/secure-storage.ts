import * as SecureStore from 'expo-secure-store';
import type { TokenPair } from '@plate/shared';

const KEY = 'plate.tokens.v1';

export async function saveTokens(tokens: TokenPair): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<TokenPair | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenPair;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
