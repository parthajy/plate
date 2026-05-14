import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config, isProd } from './config.js';
import { loggerOptions } from './lib/logger.js';
import { AppError } from './lib/errors.js';
import { healthRoutes } from './routes/health.js';

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
