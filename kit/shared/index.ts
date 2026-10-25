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
  /** Who takes the first role (the host picks in the lobby). Roles still swap after that. */
  first?: FirstPick;
}

export type FirstPick = 'random' | 'host' | 'guest';
export const FIRST_PICKS: FirstPick[] = ['random', 'host', 'guest'];

/** Fields every public state carries; games add their own. */
export interface PublicBase {
  code: string;
  you: string;
  serverNow: number;
  players: PublicPlayer[];
  phase: string;
  deadline: number | null;
  /** Added by the kit: the lobby's "who goes first" choice. */
  first?: FirstPick;
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
export const FirstSchema = z.object({ first: z.enum(['random', 'host', 'guest']) });

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; code: string; message: string };
