import type { FastifyRequest } from 'fastify';
import { UnauthorizedError } from './errors.js';
import { verifyAccessToken } from '../services/auth.js';

export async function requireAuth(req: FastifyRequest): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token');
  }
  const token = header.slice('Bearer '.length).trim();
  const claims = await verifyAccessToken(token);
  req.user = { id: claims.sub, email: claims.email };
}
