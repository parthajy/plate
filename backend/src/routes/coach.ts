import type { FastifyInstance } from 'fastify';
import { CoachSendSchema, type CoachListResponse, type CoachSendResponse } from '@plate/shared';
import { UnauthorizedError } from '../lib/errors.js';
import { requireAuth } from '../lib/auth-middleware.js';
import { listCoachMessages, sendCoachMessage } from '../services/ai/coach.js';

export async function coachRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/messages', async (req) => {
    if (!req.user) throw new UnauthorizedError();
    const rows = await listCoachMessages(req.user.id);
    const response: CoachListResponse = {
      messages: rows.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
      })),
    };
    return response;
  });

  fastify.post('/messages', async (req, reply) => {
    if (!req.user) throw new UnauthorizedError();
    const body = CoachSendSchema.parse(req.body);

    const t0 = Date.now();
    const result = await sendCoachMessage(req.user.id, body.content);
    const latencyMs = Date.now() - t0;

    req.log.info(
      {
        userId: req.user.id,
        latencyMs,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        cacheReadTokens: result.cacheReadTokens,
      },
      'coach reply',
    );

    const now = new Date().toISOString();
    const response: CoachSendResponse = {
      user: {
        id: result.userMessageId,
        role: 'user',
        content: body.content,
        createdAt: now,
      },
      assistant: {
        id: result.assistantMessageId,
        role: 'assistant',
        content: result.assistantContent,
        createdAt: now,
      },
    };
    return reply.code(200).send(response);
  });
}
