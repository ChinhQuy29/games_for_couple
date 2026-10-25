// The parts every two-player room game shares: players, room codes, the join/resume
// handshake and the ack shape. Games built on the kit extend these types.
import { z } from 'zod';

export const LIMITS = { nameMin: 1, nameMax: 20 } as const;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

export interface BasePlayer {
  id: string;
  token: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

export type PublicPlayer = Omit<BasePlayer, 'token'>;

export interface BaseRoom {
  code: string;
  createdAt: number;
  lastActivityAt: number;
  players: BasePlayer[];
  /** Every kit game starts in 'LOBBY'. */
  phase: string;
}

/** Fields every public state carries; games add their own. */
export interface PublicBase {
  code: string;
  you: string;
  serverNow: number;
  players: PublicPlayer[];
  phase: string;
  deadline: number | null;
}

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

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; code: string; message: string };
