// Moving In — the rules. Pure functions: time and randomness come in through ctx.
//
// Each player unpacks their own boxes; every item has exactly one right spot (identical
// items can swap). Once out of the box, anyone can move anything. A room is done when
// every item is unpacked and in a right spot.

import { fail, pick, requireHost, requirePhase, requirePlayer, requireTwo, type Ctx } from '@gfc/kit/server';
import { BOX_AT, FLOOR, H, HINTS_PER_ROOM, HINT_MS, ROOMS, SNAP, W, sizeOf, type Item, type Room } from '../shared';

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    startRoom: 0,
    swapBoxes: false,
    room: 0,
    items: [],
    held: {},
    hintsLeft: HINTS_PER_ROOM,
    hint: null,
    startedAt: 0,
    results: [],
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.items = [];
  room.held = {};
  room.hint = null;
  room.readyForNext = [];
}

export function updateSettings(room: Room, playerId: string, patch: { startRoom?: number; swapBoxes?: boolean }): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  if (patch.startRoom !== undefined) room.startRoom = patch.startRoom;
  if (patch.swapBoxes !== undefined) room.swapBoxes = patch.swapBoxes;
}

/** Which seat unpacks box `b` (0 = the room's first box list). */
const seatOfBox = (room: Room, b: 0 | 1): 0 | 1 => (room.swapBoxes ? ((1 - b) as 0 | 1) : b);

function beginRoom(room: Room, index: number, ctx: Ctx) {
  const def = ROOMS[index]!;
  room.phase = 'UNPACK';
  room.room = index;
  let id = 0;
  room.items = ([0, 1] as const).flatMap((b) =>
    def.boxes[b].map((kind): Item => {
      const owner = seatOfBox(room, b);
      const [x, y] = BOX_AT[owner];
      return { id: id++, kind, owner, inBox: true, x, y, slot: null };
    }),
  );
  room.held = Object.fromEntries(room.players.map((p) => [p.id, null]));
  room.hintsLeft = HINTS_PER_ROOM;
  room.hint = null;
  room.startedAt = ctx.now;
  room.readyForNext = [];
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  room.results = [];
  beginRoom(room, room.startRoom, ctx);
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'CLEAR');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  if (room.room + 1 >= ROOMS.length) {
    room.phase = 'FINISH';
    room.readyForNext = [];
  } else beginRoom(room, room.room + 1, ctx);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'CLEAR', 'FINISH');
  requireHost(room, playerId);
  resetToLobby(room);
}

const seatOf = (room: Room, playerId: string) => Math.max(0, room.players.findIndex((p) => p.id === playerId)) as 0 | 1;

function itemOf(room: Room, id: number): Item {
  return room.items.find((i) => i.id === id) ?? fail('BAD_INPUT', 'No such item');
}

/** Takes the next item out of my box. It appears on top of the box. */
export function unpack(room: Room, playerId: string): number {
  requirePhase(room, 'UNPACK');
  requirePlayer(room, playerId);
  const seat = seatOf(room, playerId);
  const next = room.items.find((i) => i.inBox && i.owner === seat) ?? fail('EMPTY', 'Your box is empty! 📦');
  const [bx, by] = BOX_AT[seat];
  // Fan items out along the box top so a few unpacked ones don't hide each other.
  const k = room.items.filter((i) => i.owner === seat).indexOf(next);
  next.inBox = false;
  next.x = bx + ((k % 3) - 1) * 48;
  next.y = by - 10;
  return next.id;
}

/** Start dragging an item that's out of its box (anyone's). */
export function grab(room: Room, playerId: string, id: number): void {
  requirePhase(room, 'UNPACK');
  requirePlayer(room, playerId);
  const item = itemOf(room, id);
  if (item.inBox) fail('IN_BOX', 'Unpack it first');
  const other = Object.entries(room.held).find(([pid, held]) => pid !== playerId && held === id);
  if (other) fail('TAKEN', 'Your partner is holding that! 🤲');
  room.held[playerId] = id;
  item.slot = null;
}

/** Is this item right where it is? */
export function isCorrect(room: Room, item: Item): boolean {
  if (item.slot === null) return false;
  const slot = ROOMS[room.room]!.slots[item.slot]!;
  return slot.kind === item.kind && (slot.owner === undefined || slot.owner === item.owner);
}

/** Drop an item at (x, y): it snaps into the nearest free slot within reach, or stays there. */
export function drop(room: Room, playerId: string, id: number, x: number, y: number, ctx: Ctx): boolean {
  requirePhase(room, 'UNPACK');
  requirePlayer(room, playerId);
  const item = itemOf(room, id);
  if (item.inBox) fail('IN_BOX', 'Unpack it first');
  if (room.held[playerId] === id) room.held[playerId] = null;
  const k = sizeOf(item.kind);
  const cx = Math.max(k.w / 2, Math.min(W - k.w / 2, x));
  const cy = Math.max(k.h, Math.min(H - 5, y));
  const slots = ROOMS[room.room]!.slots;
  let best = -1;
  let bestD = SNAP;
  slots.forEach((sl, i) => {
    const d = Math.hypot(sl.x - cx, sl.y - cy);
    const taken = room.items.some((o) => o !== item && o.slot === i);
    if (d < bestD && !taken) {
      best = i;
      bestD = d;
    }
  });
  if (best >= 0) {
    item.slot = best;
    item.x = slots[best]!.x;
    item.y = slots[best]!.y;
  } else {
    item.slot = null;
    item.x = cx;
    // Things on the wall stay put; anything near the floor rests on it.
    item.y = cy > FLOOR - 10 ? Math.max(FLOOR, cy) : cy;
  }
  if (room.hint?.item === id) room.hint = null;
  return checkDone(room, ctx.now);
}

function checkDone(room: Room, now: number): boolean {
  if (!room.items.every((i) => !i.inBox && isCorrect(room, i))) return false;
  room.phase = 'CLEAR';
  room.results.push({ room: room.room, ms: now - room.startedAt, hints: HINTS_PER_ROOM - room.hintsLeft });
  room.hint = null;
  room.held = {};
  room.readyForNext = [];
  return true;
}

/** Shows a ghost outline of where one not-yet-right item belongs. */
export function useHint(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'UNPACK');
  requirePlayer(room, playerId);
  if (room.hintsLeft <= 0) fail('NO_HINTS', 'No hints left in this room 💡');
  const def = ROOMS[room.room]!;
  // Prefer something already out of a box and in the wrong place, then something still boxed.
  const candidates = room.items.filter((i) => !isCorrect(room, i));
  const out = candidates.filter((i) => !i.inBox);
  const item = out.length ? pick(out, ctx.rng) : candidates[0];
  if (!item) fail('ALL_GOOD', 'Everything is already in place!');
  // A slot this item belongs in that isn't already correctly filled.
  const slot = def.slots.findIndex(
    (sl, i) =>
      sl.kind === item!.kind &&
      (sl.owner === undefined || sl.owner === item!.owner) &&
      !room.items.some((o) => o.slot === i && isCorrect(room, o)),
  );
  if (slot < 0) fail('ALL_GOOD', 'Everything is already in place!');
  room.hintsLeft -= 1;
  room.hint = { item: item!.id, slot, until: ctx.now + HINT_MS };
}

/** Misplaced items, once nothing is left in either box. */
export function wrongItems(room: Room): number[] {
  if (room.phase !== 'UNPACK' || room.items.some((i) => i.inBox)) return [];
  return room.items.filter((i) => !isCorrect(room, i)).map((i) => i.id);
}

export function wakeAt(room: Room): number | null {
  return room.hint ? room.hint.until : null;
}

export function tick(room: Room, ctx: Ctx): boolean {
  if (room.hint && ctx.now >= room.hint.until) {
    room.hint = null;
    return true;
  }
  return false;
}
