import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ZodError } from 'zod';
import { config, isProd } from './config.js';
import { loggerOptions } from './lib/logger.js';
import { AppError } from './lib/errors.js';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { meRoutes } from './routes/me.js';
import './types.js';

async function build() {
  const fastify = Fastify({
    logger: loggerOptions,
    trustProxy: true,
    disableRequestLogging: false,
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
    const message = err instanceof Error ? err.message : String(err);
    void reply.code(500).send({
      error: { code: 'INTERNAL', message: isProd ? 'Internal server error' : message },
    });
  });

  await fastify.register(healthRoutes);
  await fastify.register(authRoutes, { prefix: '/v1/auth' });
  await fastify.register(meRoutes, { prefix: '/v1/me' });

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
