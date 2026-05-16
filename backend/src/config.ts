import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  ANTHROPIC_API_KEY: z.string().optional(),

  // Transactional email for the OTP login flow.
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),

  SPACES_ENDPOINT: z.string().url().optional(),
  SPACES_REGION: z.string().optional(),
  SPACES_BUCKET: z.string().optional(),
  SPACES_ACCESS_KEY: z.string().optional(),
  SPACES_SECRET: z.string().optional(),

  APPLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_ID_IOS: z.string().optional(),
  GOOGLE_CLIENT_ID_ANDROID: z.string().optional(),
  GOOGLE_CLIENT_ID_WEB: z.string().optional(),

  SENTRY_DSN: z.string().url().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

function load(): Config {
  // Treat empty-string env values as "not set" so optional .url() fields
  // don't trip on `FOO=` lines in .env files.
  const env = Object.fromEntries(
    Object.entries(process.env).map(([k, v]) => [k, v === '' ? undefined : v]),
  );
  const result = ConfigSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    console.error(`Invalid environment configuration:\n${issues}`);
    process.exit(1);
  }
  return result.data;
}

export const config = load();
export const isProd = config.NODE_ENV === 'production';
