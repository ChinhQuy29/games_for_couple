import { z } from 'zod';
import { CATEGORIES, LIMITS, MODES, REACTIONS } from './constants';

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

export const SettingsPatchSchema = z
  .object({
    rounds: z.union([z.literal(3), z.literal(5), z.literal(7), z.literal(10)]),
    mode: z.enum(MODES),
    timerSec: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90), z.null()]),
    modifiersOn: z.boolean(),
    categories: z.array(z.enum(categoryIds)).min(1),
  })
  .partial();

// Text is length-checked after cleanup in the game logic; this is a coarse guard.
export const TextSchema = z.object({ text: z.string().max(500) });
export const StarterSubmitSchema = z.object({ text: z.string().max(500), fromDeck: z.boolean() });
export const ReactionSchema = z.object({ sentenceId: z.string().max(40), emoji: z.enum(REACTIONS) });
export const RatingSchema = z.object({
  sentenceId: z.string().max(40),
  value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
});
export const TypingSchema = z.object({ typing: z.boolean() });
export const EmptySchema = z.object({});

export type SettingsPatch = z.infer<typeof SettingsPatchSchema>;

export type ErrorCode =
  | 'BAD_INPUT'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'GAME_IN_PROGRESS'
  | 'NOT_IN_ROOM'
  | 'NOT_HOST'
  | 'WRONG_PHASE'
  | 'NOT_YOUR_TURN'
  | 'NEED_TWO_PLAYERS'
  | 'TOO_SHORT'
  | 'NO_REROLLS'
  | 'ALREADY_SUBMITTED'
  | 'RATE_LIMITED';

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; code: ErrorCode; message: string };
