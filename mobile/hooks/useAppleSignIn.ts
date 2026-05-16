import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { ApiError } from '../lib/api';
import { useAuth } from '../stores/auth';

interface AppleSignInState {
  available: boolean;
  inFlight: boolean;
  error: string | null;
  signIn: () => Promise<void>;
}

export function useAppleSignIn(): AppleSignInState {
  const signInWithAppleIdentityToken = useAuth((s) => s.signInWithAppleIdentityToken);
  const [available, setAvailable] = useState(false);
  const [inFlight, setInFlight] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setAvailable(false);
      return;
    }
    void AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  const signIn = async () => {
    setError(null);
    setInFlight(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const identityToken = credential.identityToken;
      if (!identityToken) {
        setError('Apple did not return a credential.');
        return;
      }
      await signInWithAppleIdentityToken({
        identityToken,
        ...(credential.fullName?.givenName ? { givenName: credential.fullName.givenName } : {}),
        ...(credential.fullName?.familyName ? { familyName: credential.fullName.familyName } : {}),
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err?.code === 'ERR_REQUEST_CANCELED' || err?.code === 'ERR_CANCELED') {
        // user dismissed — silent
      } else {
        setError(e instanceof ApiError ? e.message : (err?.message ?? 'Sign-in failed.'));
      }
    } finally {
      setInFlight(false);
    }
  };

  return { available, inFlight, error, signIn };
}
