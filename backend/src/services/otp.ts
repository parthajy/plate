import crypto from 'node:crypto';
import { and, desc, eq, gte, isNull } from 'drizzle-orm';
import { config } from '../config.js';
import { db } from '../db/client.js';
import { otpCodes, users } from '../db/schema.js';
import { AppError } from '../lib/errors.js';
import { issueTokens } from './auth.js';
import type { TokenPair } from '@plate/shared';
import { sendOtpEmail } from './mail.js';

const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function generateCode(): string {
  // Cryptographically random 6-digit code with leading zeros.
  const max = 10 ** OTP_LENGTH;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(OTP_LENGTH, '0');
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function requestOtp(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);

  await db.insert(otpCodes).values({ email, codeHash, expiresAt });
  await sendOtpEmail(email, code);
}

export interface VerifyOtpResult {
  tokens: TokenPair;
  isNewUser: boolean;
  userId: string;
}

export async function verifyOtp(rawEmail: string, code: string): Promise<VerifyOtpResult> {
  const email = normalizeEmail(rawEmail);
  if (!/^\d{6}$/.test(code)) {
    throw new AppError('OTP_INVALID', 'Code must be 6 digits', 400);
  }

  // App Store review backdoor: a fixed (email, code) pair bypasses the OTP
  // table so Apple reviewers can sign in without our email inbox. Gated by
  // both env vars being set; absence in any other env means normal flow.
  const isReviewBypass =
    config.DEMO_REVIEW_EMAIL !== undefined &&
    config.DEMO_REVIEW_OTP !== undefined &&
    email === normalizeEmail(config.DEMO_REVIEW_EMAIL) &&
    code === config.DEMO_REVIEW_OTP;

  if (!isReviewBypass) {
    const now = new Date();
    const rows = await db
      .select()
      .from(otpCodes)
      .where(
        and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt), gte(otpCodes.expiresAt, now)),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new AppError('OTP_EXPIRED', 'Code expired or not found — request a new one', 400);
    }
    if (row.attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError('OTP_LOCKED', 'Too many tries — request a new code', 429);
    }

    if (row.codeHash !== hashCode(code)) {
      // Increment attempts so brute-force locks out.
      await db
        .update(otpCodes)
        .set({ attempts: row.attempts + 1 })
        .where(eq(otpCodes.id, row.id));
      throw new AppError('OTP_WRONG', 'Wrong code', 400);
    }

    // Consume the code so the same one can't be reused.
    await db.update(otpCodes).set({ consumedAt: now }).where(eq(otpCodes.id, row.id));
  }

  // Find or create the user.
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: string;
  let isNewUser = false;
  if (existing[0]) {
    userId = existing[0].id;
  } else {
    const inserted = await db.insert(users).values({ email }).returning({ id: users.id });
    const row = inserted[0];
    if (!row) throw new AppError('OTP_USER_CREATE_FAILED', 'Could not create account', 500);
    userId = row.id;
    isNewUser = true;
  }

  const tokens = await issueTokens(userId, email);
  return { tokens, isNewUser, userId };
}
