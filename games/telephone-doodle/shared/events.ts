import { z } from 'zod';
import { BRUSHES, CANVAS_UNITS, COLORS, LIMITS, REACTIONS } from './constants';

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
    rounds: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    steps: z.union([z.literal(2), z.literal(4), z.literal(6)]),
    drawSec: z.union([z.literal(45), z.literal(60), z.literal(90), z.null()]),
    guessSec: z.union([z.literal(20), z.literal(30), z.literal(45), z.null()]),
    chaosOn: z.boolean(),
  })
  .partial();

const coord = z.number().int().min(0).max(CANVAS_UNITS);
export const StrokeSchema = z.object({
  c: z.number().int().min(0).max(COLORS.length - 1),
  w: z.number().int().min(0).max(BRUSHES.length - 1),
  p: z
    .array(coord)
    .min(2)
    .refine((p) => p.length % 2 === 0, 'points come in x,y pairs'),
});
export const DrawingSchema = z.object({
  strokes: z
    .array(StrokeSchema)
    .max(LIMITS.maxStrokes)
    .refine((s) => s.reduce((n, st) => n + st.p.length / 2, 0) <= LIMITS.maxPoints, 'drawing too detailed'),
});

export const PromptSubmitSchema = z.object({ text: z.string().max(300), fromDeck: z.boolean() });
export const DrawingSubmitSchema = z.object({ drawing: DrawingSchema });
export const GuessSubmitSchema = z.object({ text: z.string().max(300) });
export const ReactionSchema = z.object({ chainId: z.string().max(40), emoji: z.enum(REACTIONS) });
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
  | 'TOO_SHORT'
  | 'NO_REROLLS'
  | 'ALREADY_SUBMITTED'
  | 'RATE_LIMITED';

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; code: ErrorCode; message: string };
