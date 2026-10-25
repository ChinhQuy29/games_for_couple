import { expect, it } from 'vitest';
import { addPlayer } from '@gfc/kit/server';
import { COUNTDOWN_MS } from '../../shared';
import * as game from '../game';

// A scripted run through the last level: the lift, the key, the swap pad, the button,
// the gate, the door and the goal. Keeps the hardest level honest when it's edited.
it('level 6 can be finished: lift → key → swap → button → gate → door → goal', () => {
  const room = game.newRoom('ABCD', { now: 0, rng: Math.random });
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'A' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'B' });
  game.setStartLevel(room, 'pa', 5);
  game.startGame(room, 'pa', { now: 0, rng: Math.random });
  let stage = 0;
  for (let i = 0; i < 1500 && room.phase === 'PLAY'; i++) {
    const b = room.body;
    const t = game.simTime(room);
    const lift = (t % 6) / 6; // 0 = bottom, 0.5 = top
    let left = false;
    let right = false;
    let jump = false;
    if (stage === 0) {
      // Get under the lift and hop on when it's at the bottom.
      if (b.x > 3.2) left = true;
      else if (lift > 0.9 || lift < 0.05) {
        jump = true;
        stage = 1;
      }
    } else if (stage === 1) {
      jump = b.vy < 0;
      if (b.riding >= 0) stage = 2;
      else if (b.onGround && b.y > 14) stage = 0;
    } else if (stage === 2) {
      // Ride up and step onto the ledge at the top.
      if (b.y < 6.2) {
        right = true;
        if (b.x > 5) stage = 3;
      }
    } else if (stage === 3) {
      right = true;
      if (b.x > 12.2) {
        jump = true;
        stage = 4;
      }
    } else if (stage === 4) {
      right = b.x < 16.5;
      jump = b.vy < 0;
      if (room.gateUntil > t) stage = 5;
    } else right = true;
    const walker = room.walkerId!;
    const jumper = room.players.find((p) => p.id !== walker)!.id;
    game.setHeld(room, walker, { left, right, jump: false });
    game.setHeld(room, jumper, { left: false, right: false, jump });
    game.step(room, { now: COUNTDOWN_MS + room.steps * 33, rng: Math.random });
  }
  expect(room.phase).toBe('CLEAR');
  expect(room.hasKey).toBe(true);
  expect(room.swaps).toBe(1);
  expect(room.deaths).toBe(0);
});
