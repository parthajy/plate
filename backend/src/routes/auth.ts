import type { FastifyInstance } from 'fastify';
import { eq, and, isNull } from 'drizzle-orm';
import {
  AppleSignInSchema,
  GoogleSignInSchema,
  LoginSchema,
  OtpRequestSchema,
  OtpVerifySchema,
  RefreshSchema,
  SignupSchema,
} from '@plate/shared';
import { db } from '../db/client.js';
import { refreshTokens, users } from '../db/schema.js';
import { AppError, UnauthorizedError } from '../lib/errors.js';
import {
  hashPassword,
  hashRefreshToken,
  issueTokens,
  verifyPassword,
  verifyRefreshToken,
} from '../services/auth.js';
import { requestOtp, verifyOtp } from '../services/otp.js';
import { signInWithGoogle } from '../services/oauth/google.js';
import { signInWithApple } from '../services/oauth/apple.js';
import { emailKey, ipKey, limits, rateLimit } from '../lib/ratelimit.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/signup', async (req, reply) => {
    const body = SignupSchema.parse(req.body);
    const email = body.email.toLowerCase();
    const passwordHash = await hashPassword(body.password);

    const inserted = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        ...(body.displayName ? { displayName: body.displayName } : {}),
      })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id, email: users.email });

    const user = inserted[0];
    if (!user) {
      throw new AppError('EMAIL_TAKEN', 'An account with that email already exists', 409);
    }

    const issued = await issueTokens(user.id, user.email);
    return reply.code(201).send(issued);
  });

  fastify.post('/login', async (req, reply) => {
    const body = LoginSchema.parse(req.body);
    const email = body.email.toLowerCase();

    const found = await db
      .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = found[0];
    if (!user || !user.passwordHash) {
      // Constant-ish work to mute timing oracle. Don't tell the client whether
      // the email exists.
      await hashPassword(body.password);
      throw new UnauthorizedError('Invalid email or password');
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Invalid email or password');

    const issued = await issueTokens(user.id, user.email);
    return reply.send(issued);
  });

  fastify.post('/refresh', async (req, reply) => {
    const body = RefreshSchema.parse(req.body);
    const claims = await verifyRefreshToken(body.refreshToken);

    const records = await db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.id, claims.jti), isNull(refreshTokens.revokedAt)))
      .limit(1);

    const record = records[0];
    if (!record || record.userId !== claims.sub) {
      throw new UnauthorizedError('Refresh token not recognized');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Refresh token expired');
    }
    if (record.tokenHash !== hashRefreshToken(body.refreshToken)) {
      // Token reuse / theft: revoke the entire chain for this user as a safety
      // measure and force re-login.
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.userId, claims.sub), isNull(refreshTokens.revokedAt)));
      throw new UnauthorizedError('Refresh token mismatch');
    }

    // Rotate: revoke this refresh, issue a fresh pair.
    const userRows = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, claims.sub))
      .limit(1);
    const u = userRows[0];
    if (!u) throw new UnauthorizedError('User no longer exists');

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, claims.jti));

    const issued = await issueTokens(u.id, u.email);
    return reply.send(issued);
  });

  fastify.post('/request-otp', async (req, reply) => {
    const body = OtpRequestSchema.parse(req.body);
    // Two limits: per-IP (protects against spray) and per-email (protects the
    // inbox owner from being spammed by our service).
    await rateLimit(ipKey(req.ip), limits.authRequestOtpPerIp);
    await rateLimit(emailKey(body.email), limits.authRequestOtpPerEmail);
    await requestOtp(body.email);
    // 202 — accepted; we don't reveal whether the email exists in our DB.
    return reply.code(202).send({ ok: true });
  });

  fastify.post('/verify-otp', async (req, reply) => {
    const body = OtpVerifySchema.parse(req.body);
    await rateLimit(emailKey(body.email), limits.authVerifyOtpPerEmail);
    const result = await verifyOtp(body.email, body.code);
    return reply.send({ tokens: result.tokens, isNewUser: result.isNewUser });
  });

  fastify.post('/google', async (req, reply) => {
    const body = GoogleSignInSchema.parse(req.body);
    await rateLimit(ipKey(req.ip), limits.oauthExchangePerIp);
    const result = await signInWithGoogle(body.idToken);
    return reply.send({ tokens: result.tokens, isNewUser: result.isNewUser });
  });

  fastify.post('/apple', async (req, reply) => {
    const body = AppleSignInSchema.parse(req.body);
    await rateLimit(ipKey(req.ip), limits.oauthExchangePerIp);
    const result = await signInWithApple(body.identityToken, {
      givenName: body.givenName,
      familyName: body.familyName,
    });
    return reply.send({ tokens: result.tokens, isNewUser: result.isNewUser });
  });

  fastify.post('/logout', async (req, reply) => {
    const body = RefreshSchema.safeParse(req.body);
    if (body.success) {
      const parsed = await verifyRefreshToken(body.data.refreshToken).catch(() => null);
      if (parsed) {
        await db
          .update(refreshTokens)
          .set({ revokedAt: new Date() })
          .where(eq(refreshTokens.id, parsed.jti));
      }
    }
    return reply.code(204).send();
  });
}
