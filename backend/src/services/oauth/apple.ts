import { createRemoteJWKSet, jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import { config } from '../../config.js';
import { db } from '../../db/client.js';
import { users } from '../../db/schema.js';
import { AppError } from '../../lib/errors.js';
import { issueTokens } from '../auth.js';
import type { OAuthSignInResult } from './google.js';

const APPLE_ISSUER = 'https://appleid.apple.com';
const JWKS = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

interface AppleIdClaims {
  sub: string;
  email: string | undefined;
  emailVerified: boolean;
  isPrivateEmail: boolean;
}

async function verifyAppleIdToken(idToken: string): Promise<AppleIdClaims> {
  if (!config.APPLE_CLIENT_ID) {
    throw new AppError('OAUTH_NOT_CONFIGURED', 'Apple Sign In not configured', 500);
  }
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: APPLE_ISSUER,
      audience: config.APPLE_CLIENT_ID,
      clockTolerance: 60,
    });
    const sub = payload.sub;
    if (!sub) throw new Error('missing sub');
    // Apple sends email_verified as either boolean or string "true"/"false".
    const ev = payload.email_verified;
    const emailVerified = ev === true || ev === 'true';
    const pe = (payload as Record<string, unknown>).is_private_email;
    const isPrivateEmail = pe === true || pe === 'true';
    return {
      sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      emailVerified,
      isPrivateEmail,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'verify failed';
    throw new AppError('OAUTH_INVALID_TOKEN', `Apple ID token invalid: ${msg}`, 401);
  }
}

export interface AppleNameHint {
  givenName?: string | undefined;
  familyName?: string | undefined;
}

export async function signInWithApple(
  idToken: string,
  nameHint?: AppleNameHint,
): Promise<OAuthSignInResult> {
  const claims = await verifyAppleIdToken(idToken);

  // Apple's email is only present on the first sign-in. On returning sign-ins
  // we look up by sub only.
  const appleSub = claims.sub;
  const email = claims.email?.toLowerCase();

  // 1. Look up by appleSub (canonical).
  let userRow = (
    await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.appleSub, appleSub))
      .limit(1)
  )[0];

  // 2. Fall back to email match (if user previously signed up with email + same
  //    real Apple ID). Don't auto-merge "private relay" emails because they're
  //    per-app and may not match an OTP account.
  if (!userRow && email && !claims.isPrivateEmail) {
    const byEmail = (
      await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
    )[0];
    if (byEmail) {
      const displayName = composeName(nameHint);
      await db
        .update(users)
        .set({
          appleSub,
          ...(displayName ? { displayName } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, byEmail.id));
      userRow = byEmail;
    }
  }

  // 3. Create new user.
  let isNewUser = false;
  if (!userRow) {
    // If Apple gave us no email (returning user without scopes) we generate a
    // placeholder so the NOT NULL constraint is satisfied. Real-email users
    // get their real email here.
    const placeholderEmail = email ?? `${appleSub}@apple.plate.local`;
    const displayName = composeName(nameHint);
    const inserted = await db
      .insert(users)
      .values({
        email: placeholderEmail,
        appleSub,
        ...(displayName ? { displayName } : {}),
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

function composeName(hint: AppleNameHint | undefined): string | undefined {
  if (!hint) return undefined;
  const parts = [hint.givenName, hint.familyName].filter(
    (s): s is string => typeof s === 'string' && s.length > 0,
  );
  return parts.length > 0 ? parts.join(' ') : undefined;
}
