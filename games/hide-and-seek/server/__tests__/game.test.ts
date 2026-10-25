import { describe, expect, it } from 'vitest';
import { MAP_IDS, POINTS, PROP_TYPES, TIMING, WORLD, type Room } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../view';

function seededRng(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

const ctxAt = (now: number, rng = seededRng()) => ({ now, rng });

function startedRoom(overrides: Partial<Room['settings']> = {}, seed = 42) {
  const room = game.newRoom('ABCD', ctxAt(0));
  game.addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  game.addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.updateSettings(room, 'pa', overrides);
  game.startGame(room, 'pa', ctxAt(1000, seededRng(seed)));
  const round = game.currentRound(room)!;
  return { room, round, hider: round.hiderId, hunter: round.hunterId };
}

/** A real (non-fake) prop the hunter can waste a shot on. */
const realProp = (room: Room, i = 0) => game.currentRound(room)!.props[i]!;

describe('layouts', () => {
  it('fills every map inside the world with unique ids', () => {
    for (const map of MAP_IDS) {
      for (let seed = 1; seed <= 20; seed++) {
        const ids = new Set<string>();
        const { props } = game.buildLayout(map, seededRng(seed), ids);
        expect(props.length).toBeGreaterThan(10);
        expect(new Set(props.map((p) => p.id)).size).toBe(props.length);
        for (const p of props) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(WORLD.w);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(WORLD.h);
        }
      }
    }
  });

  it('offers 3 hideable choices that already exist in the room', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { round } = startedRoom({}, seed);
      expect(round.choices).toHaveLength(3);
      const present = new Set(round.props.map((p) => p.type));
      for (const c of round.choices) {
        expect(PROP_TYPES[c].hideable).toBe(true);
        expect(present.has(c)).toBe(true);
      }
      expect(round.props.some((p) => p.id === round.hiderPropId)).toBe(false);
    }
  });
});

describe('hiding', () => {
  it('only the hider can pick, place and finish hiding; placement is normalized', () => {
    const { room, round, hider, hunter } = startedRoom();
    expect(room.phase).toBe('HIDE');
    expect(() => game.place(room, hunter, { x: 1, y: 1, rot: 0, scale: 1 })).toThrow(
      expect.objectContaining({ code: 'NOT_YOUR_ROLE' }),
    );
    expect(() => game.pickObject(room, hider, 'sofa')).toThrow(expect.objectContaining({ code: 'BAD_INPUT' }));
    game.pickObject(room, hider, round.choices[2]!);
    expect(round.hiderType).toBe(round.choices[2]);
    game.place(room, hider, { x: 5000, y: -20, rot: 37, scale: 3 });
    expect(round.hider.x).toBeLessThanOrEqual(WORLD.w);
    expect(round.hider.y).toBeGreaterThanOrEqual(0);
    expect(round.hider.rot).toBe(30);
    expect(round.hider.scale).toBe(1.1);
    game.place(room, hider, { x: 400, y: 300, rot: -15, scale: 0.9 });
    expect(round.hider).toEqual({ x: 400, y: 300, rot: 345, scale: 0.9 });
    game.hideReady(room, hider, ctxAt(5000));
    expect(room.phase).toBe('SEEK');
    expect(room.deadline).toBe(5000 + 60_000);
  });

  it('moves on to SEEK by itself when hiding time runs out', () => {
    const { room } = startedRoom({ hideSec: 30 });
    expect(game.wakeAt(room)).toBe(1000 + 30_000 + TIMING.graceMs);
    expect(game.tick(room, ctxAt(31_000))).toBe(false);
    expect(game.tick(room, ctxAt(33_000))).toBe(true);
    expect(room.phase).toBe('SEEK');
  });
});

describe('seeking', () => {
  it('a hit ends the round; the hunter scores 100 + 20 per unused shot', () => {
    const { room, round, hider, hunter } = startedRoom({ shots: 5 });
    game.hideReady(room, hider, ctxAt(2000));
    expect(game.shoot(room, hunter, realProp(room, 0).id, ctxAt(3000))).toBe(false);
    expect(() => game.shoot(room, hunter, realProp(room, 0).id, ctxAt(3000))).toThrow(
      expect.objectContaining({ code: 'ALREADY_SHOT' }),
    );
    expect(() => game.shoot(room, hider, realProp(room, 1).id, ctxAt(3000))).toThrow(
      expect.objectContaining({ code: 'NOT_YOUR_ROLE' }),
    );
    expect(game.shoot(room, hunter, round.hiderPropId, ctxAt(4000))).toBe(true);
    expect(room.phase).toBe('REVEAL');
    expect(round.result).toBe('found');
    expect(round.points).toEqual({ [hunter]: POINTS.found + 3 * POINTS.perUnusedShot, [hider]: POINTS.perMiss });
  });

  it('the hider survives when shots run out or time runs out', () => {
    const { room, round, hider, hunter } = startedRoom({ shots: 3 });
    game.hideReady(room, hider, ctxAt(2000));
    for (let i = 0; i < 3; i++) game.shoot(room, hunter, realProp(room, i).id, ctxAt(3000 + i));
    expect(round.result).toBe('survived');
    expect(round.points[hider]).toBe(POINTS.survived + 3 * POINTS.perMiss);
    expect(round.points[hunter]).toBe(0);

    const second = startedRoom({}, 7);
    game.hideReady(second.room, second.hider, ctxAt(2000));
    game.tick(second.room, ctxAt(2000 + 60_000 + TIMING.graceMs));
    expect(game.currentRound(second.room)!.result).toBe('survived');
  });

  it('sneak moves are limited and only for the hider', () => {
    const { room, round, hider, hunter } = startedRoom({ sneaks: 2 });
    game.hideReady(room, hider, ctxAt(2000));
    expect(() => game.sneak(room, hunter, 100, 100)).toThrow(expect.objectContaining({ code: 'NOT_YOUR_ROLE' }));
    game.sneak(room, hider, 300, 300);
    game.sneak(room, hider, 600, 600);
    expect(round.hider).toMatchObject({ x: 600, y: 600 });
    expect(() => game.sneak(room, hider, 900, 900)).toThrow(expect.objectContaining({ code: 'NO_SNEAKS' }));
  });

  it('taunts wiggle the fake every 15s and clear after a moment', () => {
    const { room, round, hider } = startedRoom({ taunts: true });
    game.hideReady(room, hider, ctxAt(0));
    expect(game.wakeAt(room)).toBe(TIMING.tauntEveryMs);
    expect(game.tick(room, ctxAt(TIMING.tauntEveryMs))).toBe(true);
    expect(room.taunt?.propId).toBe(round.hiderPropId);
    expect(game.wakeAt(room)).toBe(TIMING.tauntEveryMs + TIMING.tauntLengthMs);
    game.tick(room, ctxAt(TIMING.tauntEveryMs + TIMING.tauntLengthMs));
    expect(room.taunt).toBeNull();
    expect(game.wakeAt(room)).toBe(2 * TIMING.tauntEveryMs);
  });
});

describe('rounds', () => {
  it('swaps roles every round and ends in RECAP', () => {
    const { room } = startedRoom({ rounds: 4, shots: 3 });
    const hiders: string[] = [];
    for (let r = 1; r <= 4; r++) {
      const round = game.currentRound(room)!;
      hiders.push(round.hiderId);
      game.hideReady(room, round.hiderId, ctxAt(r * 1000));
      game.shoot(room, round.hunterId, round.hiderPropId, ctxAt(r * 1000 + 1));
      game.readyForNext(room, 'pa', ctxAt(r * 1000 + 2));
      game.readyForNext(room, 'pb', ctxAt(r * 1000 + 3));
    }
    expect(room.phase).toBe('RECAP');
    expect(hiders[0]).not.toBe(hiders[1]);
    expect(hiders[0]).toBe(hiders[2]);
    expect(room.scores.pa! + room.scores.pb!).toBe(4 * (POINTS.found + 2 * POINTS.perUnusedShot));
    game.rematch(room, 'pb');
    expect(room.phase).toBe('LOBBY');
  });

  it('never uses the same map twice in a row on random', () => {
    const { room } = startedRoom({ rounds: 6 });
    for (let r = 1; r < 6; r++) {
      const round = game.currentRound(room)!;
      game.hideReady(room, round.hiderId, ctxAt(r * 1000));
      game.shoot(room, round.hunterId, round.hiderPropId, ctxAt(r * 1000 + 1));
      game.readyForNext(room, 'pa', ctxAt(r * 1000 + 2));
      game.readyForNext(room, 'pb', ctxAt(r * 1000 + 3));
    }
    const maps = room.rounds.map((r) => r.map);
    for (let i = 1; i < maps.length; i++) expect(maps[i]).not.toBe(maps[i - 1]);
  });
});

describe('view redaction', () => {
  it('the hunter sees nothing of the room while the hider hides', () => {
    const { room, hider, hunter } = startedRoom();
    const forHunter = toPublicState(room, hunter, 0).round!;
    expect(forHunter.props).toBeNull();
    expect(forHunter.choices).toBeNull();
    expect(forHunter.hider).toBeNull();
    const forHider = toPublicState(room, hider, 0).round!;
    expect(forHider.props!.length).toBeGreaterThan(0);
    expect(forHider.choices).toHaveLength(3);
    expect(forHider.hider).not.toBeNull();
  });

  it('while seeking, the fake is indistinguishable for the hunter', () => {
    const { room, round, hider, hunter } = startedRoom();
    game.hideReady(room, hider, ctxAt(2000));
    const s = toPublicState(room, hunter, 0).round!;
    expect(s.myPropId).toBeNull();
    expect(s.hiderPropId).toBeNull();
    expect(s.hider).toBeNull();
    const fake = s.props!.find((p) => p.id === round.hiderPropId)!;
    const real = s.props!.find((p) => p.id !== round.hiderPropId)!;
    expect(Object.keys(fake).sort()).toEqual(Object.keys(real).sort());
    const ids = s.props!.map((p) => p.id);
    expect([...ids].sort()).toEqual(ids); // sorted by id, so list position leaks nothing
    expect(JSON.stringify(toPublicState(room, hunter, 0)).includes('token-')).toBe(false);
    // The hider knows which one is theirs.
    expect(toPublicState(room, hider, 0).round!.myPropId).toBe(round.hiderPropId);
  });

  it('shows the taunt only while it plays, and reveals everything after the round', () => {
    const { room, round, hider, hunter } = startedRoom();
    game.hideReady(room, hider, ctxAt(0));
    game.tick(room, ctxAt(TIMING.tauntEveryMs));
    expect(toPublicState(room, hunter, 0).tauntPropId).toBe(round.hiderPropId);
    game.tick(room, ctxAt(TIMING.tauntEveryMs + TIMING.tauntLengthMs));
    expect(toPublicState(room, hunter, 0).tauntPropId).toBeNull();
    game.shoot(room, hunter, round.hiderPropId, ctxAt(20_000));
    const after = toPublicState(room, hunter, 0).round!;
    expect(after.hiderPropId).toBe(round.hiderPropId);
    expect(after.hider).not.toBeNull();
    expect(after.points).not.toBeNull();
  });
});
