import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';
import { config } from '../config.js';
import { UnauthorizedError } from '../lib/errors.js';

const BCRYPT_COST = 12;
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
const ISSUER = 'plate.best';
const AUDIENCE = 'plate-mobile';

const accessSecret = new TextEncoder().encode(config.JWT_SECRET);
const refreshSecret = new TextEncoder().encode(config.JWT_REFRESH_SECRET);

export interface AccessClaims {
  sub: string; // userId
  email: string;
}

export interface RefreshClaims {
  sub: string;
  jti: string; // matches refresh_tokens.id
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newRefreshTokenId(): string {
  return randomBytes(16).toString('hex');
}

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ email: claims.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(accessSecret);
}

export async function signRefreshToken(claims: RefreshClaims): Promise<string> {
  return new SignJWT({ jti: claims.jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SECONDS}s`)
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  try {
    const { payload } = await jwtVerify(token, accessSecret, {
      issuer: ISSUER,
      audience: AUDIENCE,
      clockTolerance: 60,
    });
    const email = payload.email;
    if (!payload.sub || typeof email !== 'string') {
      throw new UnauthorizedError('Malformed token');
    }
    return { sub: payload.sub, email };
  } catch (err) {
    if (err instanceof joseErrors.JOSEError) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    throw err;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshClaims> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret, {
      issuer: ISSUER,
      audience: AUDIENCE,
      clockTolerance: 60,
    });
    const jti = payload.jti;
    if (!payload.sub || typeof jti !== 'string') {
      throw new UnauthorizedError('Malformed refresh token');
    }
    return { sub: payload.sub, jti };
  } catch (err) {
    if (err instanceof joseErrors.JOSEError) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    throw err;
  }
}

export const tokens = {
  accessTtlSeconds: ACCESS_TTL_SECONDS,
  refreshTtlSeconds: REFRESH_TTL_SECONDS,
};
