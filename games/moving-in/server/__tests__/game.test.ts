import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import { H, KINDS, ROOMS, W, type Room } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });

function start(startRoom = 0, swapBoxes = false) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.updateSettings(room, 'pa', { startRoom, swapBoxes });
  game.startGame(room, 'pa', ctxAt(1000));
  return room;
}

const seatPlayer = (seat: number) => (seat === 0 ? 'pa' : 'pb');

/** Unpacks everything and puts each item in a right slot. */
function solve(room: Room, now = 5000) {
  const def = ROOMS[room.room]!;
  const used = new Set<number>();
  for (const seat of [0, 1]) while (room.items.some((i) => i.inBox && i.owner === seat)) game.unpack(room, seatPlayer(seat));
  for (const item of room.items) {
    if (room.phase !== 'UNPACK') break;
    const i = def.slots.findIndex((sl, k) => !used.has(k) && sl.kind === item.kind && (sl.owner === undefined || sl.owner === item.owner));
    used.add(i);
    const who = seatPlayer(item.owner);
    game.grab(room, who, item.id);
    game.drop(room, who, item.id, def.slots[i]!.x + 10, def.slots[i]!.y - 10, ctxAt(now));
  }
}

describe('the rooms', () => {
  it('six rooms, 12 items each, and every boxed item has exactly one slot to go to', () => {
    expect(ROOMS).toHaveLength(6);
    for (const r of ROOMS) {
      const boxed = [...r.boxes[0], ...r.boxes[1]].sort();
      expect(r.slots.map((s) => s.kind).sort(), r.name).toEqual(boxed);
      expect(r.boxes[0]).toHaveLength(6);
      expect(r.boxes[1]).toHaveLength(6);
      for (const s of r.slots) {
        if (s.owner !== undefined) expect(r.boxes[s.owner], `${r.name} ${s.kind}`).toContain(s.kind);
        const k = KINDS[s.kind];
        expect(s.x - k.w / 2, `${r.name} ${s.kind}`).toBeGreaterThanOrEqual(0);
        expect(s.x + k.w / 2).toBeLessThanOrEqual(W);
        expect(s.y - k.h).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(H);
      }
    }
  });

  it('different kinds of slot are far enough apart to tell where you dropped', () => {
    for (const r of ROOMS)
      r.slots.forEach((a, i) =>
        r.slots.forEach((b, j) => {
          if (i < j && a.kind !== b.kind) expect(Math.hypot(a.x - b.x, a.y - b.y), `${r.name}: ${a.kind}/${b.kind}`).toBeGreaterThanOrEqual(44);
        }),
      );
  });
});

describe('unpacking', () => {
  it('you unpack only your own box, in order', () => {
    const room = start();
    const id = game.unpack(room, 'pa');
    const item = room.items.find((i) => i.id === id)!;
    expect(item).toMatchObject({ owner: 0, kind: ROOMS[0]!.boxes[0][0], inBox: false });
    expect(room.items.filter((i) => i.owner === 0 && i.inBox)).toHaveLength(5);
    for (let k = 0; k < 5; k++) game.unpack(room, 'pa');
    expect(() => game.unpack(room, 'pa')).toThrow(/empty/);
  });

  it('swapping boxes in the lobby gives seat 0 the second box', () => {
    const room = start(0, true);
    const id = game.unpack(room, 'pa');
    expect(room.items.find((i) => i.id === id)!.kind).toBe(ROOMS[0]!.boxes[1][0]);
  });

  it('drops snap into the nearest free slot, or stay where they land', () => {
    const room = start(3);
    const id = game.unpack(room, 'pa'); // a mug
    game.grab(room, 'pa', id);
    game.drop(room, 'pa', id, 150, 320, ctxAt(2000));
    const mug = room.items.find((i) => i.id === id)!;
    expect(mug.slot).toBe(0);
    expect([mug.x, mug.y]).toEqual([140, 330]);
    game.grab(room, 'pa', id);
    game.drop(room, 'pa', id, 700, 200, ctxAt(2000));
    expect(mug.slot).toBeNull();
    expect([mug.x, mug.y]).toEqual([700, 200]);
  });

  it('anyone can move anything out of a box, but not while the other is holding it', () => {
    const room = start();
    const id = game.unpack(room, 'pa');
    game.grab(room, 'pa', id);
    expect(() => game.grab(room, 'pb', id)).toThrow(/holding/);
    game.drop(room, 'pa', id, 400, 400, ctxAt(2000));
    game.grab(room, 'pb', id);
    game.drop(room, 'pb', id, 140, 600, ctxAt(2000));
    expect(room.items.find((i) => i.id === id)!.slot).toBe(0);
  });

  it('in room 1, your things only count in your own room', () => {
    const room = start(0);
    const id = game.unpack(room, 'pa'); // seat 0's pillow
    game.grab(room, 'pa', id);
    game.drop(room, 'pa', id, 1460, 600, ctxAt(2000)); // seat 1's bed
    const pillow = room.items.find((i) => i.id === id)!;
    expect(pillow.slot).not.toBeNull();
    expect(game.isCorrect(room, pillow)).toBe(false);
  });
});

describe('finishing rooms', () => {
  it('every room can be solved; it clears with time and hints, then moves on', () => {
    const room = start(0);
    for (let r = 0; r < 6; r++) {
      expect(room.room).toBe(r);
      solve(room, 1000 + (r + 1) * 60_000);
      expect(room.phase, ROOMS[r]!.name).toBe('CLEAR');
      game.readyForNext(room, 'pa', ctxAt(0));
      game.readyForNext(room, 'pb', ctxAt(0));
    }
    expect(room.phase).toBe('FINISH');
    expect(room.results).toHaveLength(6);
    expect(room.results[0]).toMatchObject({ room: 0, ms: 60_000, hints: 0 });
  });

  it('identical items can trade places', () => {
    const room = start(3);
    solve(room);
    expect(room.phase).toBe('CLEAR');
    const again = start(3);
    for (const seat of [0, 1]) while (again.items.some((i) => i.inBox && i.owner === seat)) game.unpack(again, seatPlayer(seat));
    const mugs = again.items.filter((i) => i.kind === 'mug');
    game.grab(again, 'pa', mugs[0]!.id);
    game.drop(again, 'pa', mugs[0]!.id, 210, 330, ctxAt(2000)); // the "other" mug's spot
    expect(game.isCorrect(again, mugs[0]!)).toBe(true);
  });

  it('wrong items glow only when both boxes are empty', () => {
    const room = start(1);
    const id = game.unpack(room, 'pa');
    game.grab(room, 'pa', id);
    game.drop(room, 'pa', id, 700, 200, ctxAt(2000));
    expect(game.wrongItems(room)).toEqual([]);
    for (const seat of [0, 1]) while (room.items.some((i) => i.inBox && i.owner === seat)) game.unpack(room, seatPlayer(seat));
    expect(game.wrongItems(room)).toContain(id);
  });
});

describe('hints and secrets', () => {
  it('a hint shows where a not-yet-right item goes, three per room, and fades', () => {
    const room = start(4);
    game.useHint(room, 'pb', ctxAt(2000));
    expect(room.hintsLeft).toBe(2);
    const view = toPublicState(room, 'pa', 2000);
    const slot = ROOMS[4]!.slots[room.hint!.slot]!;
    expect(view.hint).toMatchObject({ x: slot.x, y: slot.y, kind: slot.kind });
    expect(game.wakeAt(room)).toBe(2000 + 4000);
    game.tick(room, ctxAt(6000));
    expect(room.hint).toBeNull();
    game.useHint(room, 'pb', ctxAt(7000));
    game.useHint(room, 'pb', ctxAt(8000));
    expect(() => game.useHint(room, 'pb', ctxAt(9000))).toThrow(/No hints/);
  });

  it('the view never says which kind belongs in which slot, and leaks no tokens', () => {
    const room = start(2);
    const v = toPublicState(room, 'pa', 0);
    expect(v.slots[0]).toEqual({ x: ROOMS[2]!.slots[0]!.x, y: ROOMS[2]!.slots[0]!.y });
    expect(JSON.stringify(v.slots)).not.toContain('kind');
    expect(JSON.stringify(v)).not.toContain('token-');
    expect(v.mySeat).toBe(0);
    expect(v.boxLeft).toEqual([6, 6]);
  });
});
