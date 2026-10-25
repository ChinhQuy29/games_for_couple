import { z } from 'zod';
import { LIMITS, MAP_OPTIONS, PROP_TYPES, SCALE_RANGE, WORLD } from './constants';

const propTypes = Object.keys(PROP_TYPES) as [string, ...string[]];

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
    rounds: z.union([z.literal(2), z.literal(4), z.literal(6)]),
    hideSec: z.union([z.literal(30), z.literal(45), z.literal(60)]),
    seekSec: z.union([z.literal(45), z.literal(60), z.literal(90)]),
    shots: z.union([z.literal(3), z.literal(5), z.literal(7)]),
    map: z.enum(MAP_OPTIONS),
    taunts: z.boolean(),
    sneaks: z.union([z.literal(0), z.literal(2), z.literal(3)]),
    firstHider: z.enum(['random', 'host', 'guest']),
  })
  .partial();

const x = z.number().min(0).max(WORLD.w);
const y = z.number().min(0).max(WORLD.h);

export const PickSchema = z.object({ type: z.enum(propTypes) });
export const PlaceSchema = z.object({
  x,
  y,
  rot: z.number().min(-720).max(720),
  scale: z.number().min(SCALE_RANGE.min).max(SCALE_RANGE.max),
});
export const ShootSchema = z.object({ propId: z.string().min(1).max(20) });
export const SneakSchema = z.object({ x, y });

export type SettingsPatch = z.infer<typeof SettingsPatchSchema>;

export type ErrorCode =
  | 'BAD_INPUT'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'GAME_IN_PROGRESS'
  | 'NOT_IN_ROOM'
  | 'NOT_HOST'
  | 'WRONG_PHASE'
  | 'NOT_YOUR_ROLE'
  | 'NEED_TWO_PLAYERS'
  | 'TOO_SHORT'
  | 'NO_SHOTS'
  | 'NO_SNEAKS'
  | 'ALREADY_SHOT';

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; code: ErrorCode; message: string };
