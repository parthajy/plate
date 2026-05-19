import * as Sentry from '@sentry/node';
import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ZodError } from 'zod';
import { config, isProd } from './config.js';

// Sentry must be initialized as early as possible so it catches errors from
// imports / module evaluation. Skipped entirely if SENTRY_DSN isn't set —
// fine for dev and useful as an escape hatch.
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    tracesSampleRate: isProd ? 0.1 : 0,
    // Don't sample logs as breadcrumbs in prod — too noisy.
    sendDefaultPii: false,
  });
}
import { loggerOptions } from './lib/logger.js';
import { AppError } from './lib/errors.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import { foodRoutes } from './routes/food.js';
import { coachRoutes } from './routes/coach.js';
import { pantryRoutes } from './routes/pantry.js';
import { workoutRoutes } from './routes/workouts.js';
import { webhookRoutes } from './routes/webhooks.js';
import './types.js';

async function build() {
  const fastify = Fastify({
    logger: loggerOptions,
    trustProxy: true,
    disableRequestLogging: false,
    // Food-scan uploads arrive as base64 JSON; 8MB headroom covers a
    // ~6MB raw image after 33% base64 inflation.
    bodyLimit: 8 * 1024 * 1024,
  });

  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, { origin: true });
  await fastify.register(sensible);

  fastify.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      void reply.code(400).send({
        error: {
          code: 'VALIDATION',
          message: 'Invalid request',
          issues: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
      });
      return;
    }
    if (err instanceof AppError) {
      void reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, ...(err.details ?? {}) },
      });
      return;
    }
    req.log.error({ err }, 'unhandled error');
    // Send to Sentry with request context so we can see what endpoint failed
    // for which user. AppError / ZodError are handled above and aren't sent
    // (they're user errors, not server bugs).
    Sentry.withScope((scope) => {
      scope.setTag('route', `${req.method} ${req.routeOptions?.url ?? req.url}`);
      if (req.user) scope.setUser({ id: req.user.id });
      Sentry.captureException(err);
    });
    const message = err instanceof Error ? err.message : String(err);
    void reply.code(500).send({
      error: { code: 'INTERNAL', message: isProd ? 'Internal server error' : message },
    });
  });

  await fastify.register(healthRoutes);
  await fastify.register(authRoutes, { prefix: '/v1/auth' });
  await fastify.register(meRoutes, { prefix: '/v1/me' });
  await fastify.register(foodRoutes, { prefix: '/v1/food' });
  await fastify.register(coachRoutes, { prefix: '/v1/coach' });
  await fastify.register(pantryRoutes, { prefix: '/v1/pantry' });
  await fastify.register(workoutRoutes, { prefix: '/v1/workouts' });
  await fastify.register(webhookRoutes, { prefix: '/v1/webhooks' });

  return fastify;
}

async function main(): Promise<void> {
  const fastify = await build();
  try {
    await fastify.listen({ port: config.PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error({ err }, 'failed to start');
    process.exit(1);
  }
}

main();
