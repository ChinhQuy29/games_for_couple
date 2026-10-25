import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';
import type { Kind } from './rooms';

export * from './rooms';

export interface Item {
  id: number;
  kind: Kind;
  /** Whose box it came from: player seat 0 or 1 (after the lobby's swap setting). */
  owner: 0 | 1;
  inBox: boolean;
  x: number;
  y: number;
  /** Index of the slot it snapped into, or null if it's just sitting somewhere. */
  slot: number | null;
}

export interface RoomResult {
  room: number;
  ms: number;
  hints: number;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'UNPACK' | 'CLEAR' | 'FINISH';
  startRoom: number;
  /** Swap whose stuff is whose (seat 0 gets box B). */
  swapBoxes: boolean;
  room: number;
  items: Item[];
  /** Who is dragging what. */
  held: Record<string, number | null>;
  hintsLeft: number;
  hint: { item: number; slot: number; until: number } | null;
  startedAt: number;
  results: RoomResult[];
  readyForNext: string[];
}

export interface PublicSlot {
  x: number;
  y: number;
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  startRoom: number;
  swapBoxes: boolean;
  room: number;
  mySeat: number;
  items: Item[];
  /** Slot positions only: which kind belongs where stays on the server. */
  slots: PublicSlot[];
  held: Record<string, number | null>;
  /** Items left in each seat's box. */
  boxLeft: [number, number];
  /** Misplaced items, only once both boxes are empty (like the red glow in Dreamy Room). */
  wrong: number[];
  hintsLeft: number;
  /** A ghost outline: this item's kind, drawn at this spot. */
  hint: { item: number; kind: Kind; x: number; y: number; until: number } | null;
  startedAt: number;
  results: RoomResult[];
  readyForNext: string[];
}

export const SettingsSchema = z.object({ startRoom: z.number().int().min(0).max(5).optional(), swapBoxes: z.boolean().optional() });
export const ItemSchema = z.object({ item: z.number().int().min(0).max(999) });
export const DropSchema = z.object({ item: z.number().int().min(0).max(999), x: z.number().finite(), y: z.number().finite() });
