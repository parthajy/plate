import { createRemoteJWKSet, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import type { TokenPair } from '@plate/shared';
import { config } from '../../config.js';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import { issueTokens } from '../auth.js';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

interface GoogleIdClaims {
  sub: string;
  email: string | undefined;
  email_verified: boolean | undefined;
  name: string | undefined;
  picture: string | undefined;
  aud: string;
  iss: string;
}

function audiences(): string[] {
  return [
    config.GOOGLE_CLIENT_ID_IOS,
    config.GOOGLE_CLIENT_ID_ANDROID,
    config.GOOGLE_CLIENT_ID_WEB,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0);
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdClaims> {
  const aud = audiences();
  if (aud.length === 0) {
    throw new AppError('OAUTH_NOT_CONFIGURED', 'Google OAuth not configured', 500);
  }
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: GOOGLE_ISSUERS,
      audience: aud,
      clockTolerance: 60,
    });
    const sub = payload.sub;
    if (!sub) throw new Error('missing sub');
    return {
      sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      email_verified: payload.email_verified === true,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      picture: typeof payload.picture === 'string' ? payload.picture : undefined,
      aud: String(payload.aud ?? ''),
      iss: String(payload.iss ?? ''),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'verify failed';
    throw new AppError('OAUTH_INVALID_TOKEN', `Google ID token invalid: ${msg}`, 401);
  }
}

export interface OAuthSignInResult {
  tokens: TokenPair;
  isNewUser: boolean;
  userId: string;
}

export async function signInWithGoogle(idToken: string): Promise<OAuthSignInResult> {
  const claims = await verifyGoogleIdToken(idToken);
  if (!claims.email_verified) {
    throw new AppError(
      'OAUTH_EMAIL_UNVERIFIED',
      'Verify your email with Google before signing in',
      400,
    );
  }
  if (!claims.email) {
    throw new AppError('OAUTH_NO_EMAIL', 'Google account has no email', 400);
  }
  const email = claims.email.toLowerCase();
  const googleSub = claims.sub;

  // 1. Look up by googleSub first (canonical for repeat Google sign-ins).
  let userRow = (
    await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.googleSub, googleSub))
      .limit(1)
  )[0];

  // 2. If not, look up by email — claim the account.
  if (!userRow) {
    const byEmail = (
      await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
    )[0];
    if (byEmail) {
      await db
        .update(users)
        .set({
          googleSub,
          ...(claims.name ? { displayName: claims.name } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, byEmail.id));
      userRow = byEmail;
    }
  }

  // 3. Create.
  let isNewUser = false;
  if (!userRow) {
    const inserted = await db
      .insert(users)
      .values({
        email,
        googleSub,
        ...(claims.name ? { displayName: claims.name } : {}),
      })
      .returning({ id: users.id, email: users.email });
    const row = inserted[0];
    if (!row) throw new AppError('OAUTH_USER_CREATE_FAILED', 'Could not create account', 500);
    userRow = row;
    isNewUser = true;
  }

  const tokens = await issueTokens(userRow.id, userRow.email);
  return { tokens, isNewUser, userId: userRow.id };
}
