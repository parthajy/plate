import type { FastifyInstance } from 'fastify';
import { queryClient } from '../db/client.js';

const BUILD_SHA = process.env.GITHUB_SHA ?? 'dev';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async () => {
    let dbOk = false;
    try {
      await queryClient`SELECT 1`;
      dbOk = true;
    } catch (err) {
      fastify.log.warn({ err }, 'health: db check failed');
    }
    return {
      ok: dbOk,
      build: BUILD_SHA,
      ts: new Date().toISOString(),
    };
  });
}
