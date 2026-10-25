import { expect, it } from 'vitest';
import { addPlayer } from '@gfc/kit/server';
import { COUNTDOWN_MS, type Room } from '../../shared';
import * as game from '../game';

// Scripted runs through levels 7–10, so every level stays finishable when it's edited.
// The script sees the body and returns the combined input; the Walker gets left/right and
// the Jumper gets jump, as in the real game.

type Held = { left?: boolean; right?: boolean; jump?: boolean };
type Script = (b: Room['body'], t: number, room: Room) => Held;

function run(level: number, script: Script, maxSteps = 1500) {
  const room = game.newRoom('ABCD', { now: 0, rng: Math.random });
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'A' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'B' });
  game.setStartLevel(room, 'pa', level);
  game.startGame(room, 'pa', { now: 0, rng: Math.random });
  for (let i = 0; i < maxSteps && room.phase === 'PLAY'; i++) {
    const h = script(room.body, game.simTime(room), room);
    const walker = room.walkerId!;
    const jumper = room.players.find((p) => p.id !== walker)!.id;
    game.setHeld(room, walker, { left: !!h.left, right: !!h.right, jump: false });
    game.setHeld(room, jumper, { left: false, right: false, jump: !!h.jump });
    game.step(room, { now: COUNTDOWN_MS + room.steps * 33, rng: Math.random });
  }
  return room;
}

const where = (r: Room) => `at ${r.body.x.toFixed(2)},${r.body.y.toFixed(2)} after ${r.steps} steps, ${r.deaths} deaths, key ${r.hasKey}`;

/** Jump while standing with the body's left edge in one of the windows. */
const jumpAt = (b: Room['body'], windows: [number, number][]) => b.onGround && windows.some(([a, z]) => b.x > a && b.x < z);

it('level 7 (Stairway): four jumps up the steps over the spikes', () => {
  const room = run(6, (b) => ({ right: true, jump: jumpAt(b, [[4.4, 5.3], [9.6, 10.3], [14.6, 15.3], [19.6, 20.3]]) || (!b.onGround && b.vy < 0) }));
  expect(room.phase, where(room)).toBe('CLEAR');
  expect(room.deaths, where(room)).toBe(0);
});

it('level 8 (Locked in): up the ledges for the key, over the pit, through the door', () => {
  const room = run(7, (b) => ({ right: true, jump: jumpAt(b, [[2.6, 3.4], [6.4, 7.3], [16.0, 17.6]]) || (!b.onGround && b.vy < 0) }));
  expect(room.phase, where(room)).toBe('CLEAR');
  expect(room.hasKey).toBe(true);
  expect(room.deaths, where(room)).toBe(0);
});

it('level 9 (Sprint): the button opens the gate long enough to drop and run', () => {
  const room = run(8, (b) => ({ right: true, jump: jumpAt(b, [[3.2, 4.2], [7.4, 8.3], [21.2, 22.2]]) || (!b.onGround && b.vy < 0) }));
  expect(room.phase, where(room)).toBe('CLEAR');
  expect(room.deaths, where(room)).toBe(0);
});

it('level 10 (The ferry): swap, ride the raft, climb to the goal', () => {
  let stage = 0;
  const room = run(9, (b, t) => {
    const raft = (t % 6) / 6; // 0 = left end, 0.5 = right end
    if (stage === 0) {
      // Wait at the edge for the raft to come back to the left end, then hop on.
      if (b.x < 5.6) return { right: true };
      if (raft > 0.93 || raft < 0.03) {
        stage = 1;
        return { jump: true, right: true };
      }
      return {};
    }
    if (stage === 1) {
      if (b.riding >= 0) stage = 2;
      return { jump: b.vy < 0, right: b.x < 7.6 };
    }
    if (stage === 2) {
      // Ride to the right end, then jump off onto the landing.
      if (raft > 0.44 && raft < 0.5) stage = 3;
      return {};
    }
    if (stage === 3) {
      // Hop off the raft and land.
      if (b.onGround && b.riding < 0) stage = 4;
      return { right: true, jump: b.riding >= 0 || (!b.onGround && b.vy < 0) };
    }
    // Step back if we landed too far right, then jump up onto the last step.
    if (stage === 4 && b.x > 26.8) return { left: true };
    stage = 5;
    return { right: true, jump: jumpAt(b, [[26.1, 27.2]]) || (!b.onGround && b.vy < 0) };
  });
  expect(room.phase, where(room)).toBe('CLEAR');
  expect(room.swaps).toBe(1);
  expect(room.deaths, where(room)).toBe(0);
});
