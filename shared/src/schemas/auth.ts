import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(64).optional(),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof RefreshSchema>;

export const TokenPair = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  accessExpiresAt: z.string().datetime(),
  refreshExpiresAt: z.string().datetime(),
});
export type TokenPair = z.infer<typeof TokenPair>;

// OTP login: caller posts email, we email them a 6-digit code, they post it back.
export const OtpRequestSchema = z.object({
  email: z.string().email().max(254),
});
export type OtpRequestInput = z.infer<typeof OtpRequestSchema>;

export const OtpVerifySchema = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});
export type OtpVerifyInput = z.infer<typeof OtpVerifySchema>;

export const OtpVerifyResponse = z.object({
  tokens: TokenPair,
  isNewUser: z.boolean(),
});
export type OtpVerifyResponse = z.infer<typeof OtpVerifyResponse>;

// Google Sign-In: client gets an ID token from Google, posts it here.
export const GoogleSignInSchema = z.object({
  idToken: z.string().min(20),
});
export type GoogleSignInInput = z.infer<typeof GoogleSignInSchema>;

// Apple Sign In: identityToken from expo-apple-authentication. fullName is
// only present on the first sign-in and lets us seed displayName.
export const AppleSignInSchema = z.object({
  identityToken: z.string().min(20),
  givenName: z.string().trim().max(64).optional(),
  familyName: z.string().trim().max(64).optional(),
});
export type AppleSignInInput = z.infer<typeof AppleSignInSchema>;

export const OAuthSignInResponse = z.object({
  tokens: TokenPair,
  isNewUser: z.boolean(),
});
export type OAuthSignInResponse = z.infer<typeof OAuthSignInResponse>;
