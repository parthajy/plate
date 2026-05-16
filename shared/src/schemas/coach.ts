import { z } from 'zod';

export const CoachRole = z.enum(['user', 'assistant']);
export type CoachRole = z.infer<typeof CoachRole>;

export const CoachMessage = z.object({
  id: z.string().uuid(),
  role: CoachRole,
  content: z.string(),
  createdAt: z.string().datetime(),
});
export type CoachMessage = z.infer<typeof CoachMessage>;

export const CoachSendSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});
export type CoachSendInput = z.infer<typeof CoachSendSchema>;

export const CoachSendResponse = z.object({
  user: CoachMessage,
  assistant: CoachMessage,
});
export type CoachSendResponse = z.infer<typeof CoachSendResponse>;

export const CoachListResponse = z.object({
  messages: z.array(CoachMessage),
});
export type CoachListResponse = z.infer<typeof CoachListResponse>;
