import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../stores/auth';
import { ApiError } from '../lib/api';

// Required so the in-app browser dismisses cleanly after the OAuth redirect.
// Safe to call multiple times.
WebBrowser.maybeCompleteAuthSession();

// Stub client ID used only to satisfy expo-auth-session/Google's
// `invariantClientId` check on platforms where we don't have a real client
// configured yet. The button itself is hidden in that case, so the stub is
// never actually exchanged with Google.
const STUB_CLIENT_ID = '000000000000-stub.apps.googleusercontent.com';

interface GoogleSignInState {
  /** Whether OAuth env vars are configured. If false, the button should hide. */
  available: boolean;
  /** True while the user is in the OAuth flow or the backend is verifying. */
  inFlight: boolean;
  error: string | null;
  /** Trigger the OAuth prompt. */
  signIn: () => Promise<void>;
}

export function useGoogleSignIn(): GoogleSignInState {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID;

  // `Google.useAuthRequest` validates the per-platform client ID at hook init
  // and throws if missing. Detect that here so the button can be hidden
  // gracefully instead of crashing the screen.
  const available =
    Platform.OS === 'ios'
      ? !!iosClientId
      : Platform.OS === 'android'
        ? !!androidClientId
        : !!webClientId;

  const signInWithGoogleIdToken = useAuth((s) => s.signInWithGoogleIdToken);

  // Always pass *something* to satisfy the invariant, even when the real
  // client ID is missing — the button is hidden in that case so the stub is
  // never actually used.
  const [_request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: iosClientId || STUB_CLIENT_ID,
    androidClientId: androidClientId || STUB_CLIENT_ID,
    ...(webClientId ? { webClientId } : {}),
  });

  const [inFlight, setInFlight] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params.id_token ?? response.authentication?.idToken;
      if (!idToken) {
        setError('Google did not return an ID token. Try again.');
        setInFlight(false);
        return;
      }
      void (async () => {
        try {
          await signInWithGoogleIdToken(idToken);
          setInFlight(false);
        } catch (e) {
          setError(e instanceof ApiError ? e.message : 'Sign-in failed.');
          setInFlight(false);
        }
      })();
    } else if (response.type === 'error') {
      setError(response.error?.message ?? 'Google sign-in failed.');
      setInFlight(false);
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      setInFlight(false);
    }
  }, [response, signInWithGoogleIdToken]);

  const signIn = async () => {
    if (!available) {
      setError('Google sign-in is not configured.');
      return;
    }
    setError(null);
    setInFlight(true);
    try {
      await promptAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
      setInFlight(false);
    }
  };

  return { available, inFlight, error, signIn };
}
