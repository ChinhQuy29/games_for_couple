import { z } from 'zod';
import { CATEGORIES, LIMITS } from './constants';

const categoryIds = CATEGORIES.map((c) => c.id) as [string, ...string[]];

export const NameSchema = z.string().trim().min(LIMITS.nameMin).max(LIMITS.nameMax);
export const CodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}$/);

export const CreateSchema = z.object({ name: NameSchema });
export const JoinSchema = z.object({ code: CodeSchema, name: NameSchema });
export const ResumeSchema = z.object({ code: CodeSchema, token: z.string().min(10).max(64) });
export const EmptySchema = z.object({});

export const SettingsPatchSchema = z
  .object({
    questions: z.union([z.literal(10), z.literal(15), z.literal(20)]),
    timeSec: z.union([z.literal(15), z.literal(20), z.literal(30)]),
    categories: z.array(z.enum(categoryIds)).min(1),
    sgpFinale: z.boolean(),
  })
  .partial();

export const AnswerSchema = z.object({
  choice: z.number().int().min(0).max(5),
  elapsedMs: z.number().int().min(0).max(120_000),
});
export const FlagSchema = z.object({ index: z.number().int().min(1).max(100) });
export const TypingSchema = z.object({ typing: z.boolean() });

export type SettingsPatch = z.infer<typeof SettingsPatchSchema>;

export type ErrorCode =
  | 'BAD_INPUT'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'GAME_IN_PROGRESS'
  | 'NOT_IN_ROOM'
  | 'NOT_HOST'
  | 'WRONG_PHASE'
  | 'NEED_TWO_PLAYERS'
  | 'NOT_ENOUGH_QUESTIONS'
  | 'TOO_SHORT'
  | 'ALREADY_SUBMITTED'
  | 'RATE_LIMITED';

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; code: ErrorCode; message: string };
