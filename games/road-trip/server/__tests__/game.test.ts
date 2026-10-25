import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import { COUNTDOWN_MS, DRIVE, ROAD_HALF, TRIPS, forkSpread, onRoad, roadCenter, type Room } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });
const NONE = { left: false, right: false, gas: false, brake: false };

function drive(seed = 1) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.startGame(room, 'pa', ctxAt(0, seed));
  const driver = room.driverId!;
  const copilot = driver === 'pa' ? 'pb' : 'pa';
  return { room, driver, copilot };
}

const tick = (room: Room, n = 1) => {
  for (let i = 0; i < n && room.phase === 'DRIVE'; i++) game.step(room, ctxAt(COUNTDOWN_MS + room.steps * 33 + 1));
};

/** A perfect autopilot: follows the right branch, dodges everything, keeps gas on. */
function autopilot(room: Room, driver: string, copilot: string) {
  const v = room.van;
  const next = room.junctions.find((j) => !j.passed && j.d > v.d);
  const look = v.d + 8;
  let target = roadCenter(room.curve, look);
  const s = forkSpread(room.junctions, look);
  if (next && s > 0.5) target += next.correct === 'left' ? -s : s;
  const danger = room.obstacles.find((o) => !o.hit && o.kind !== 'fuel' && o.kind !== 'mud' && o.d > v.d && o.d - v.d < 14 && Math.abs(o.x - target) < 1.8);
  if (danger) target += danger.x > target ? -2.2 : 2.2;
  const fuel = room.obstacles.find((o) => !o.hit && o.kind === 'fuel' && o.d > v.d && o.d - v.d < 14);
  if (fuel && !danger) target = fuel.x;
  game.setHeld(room, driver, { ...NONE, left: v.x > target + 0.2, right: v.x < target - 0.2 });
  game.setHeld(room, copilot, { ...NONE, gas: true });
}

describe('the road', () => {
  it('forks open, hold, and close again; both branches are road, the middle is not', () => {
    const js = [{ d: 300 }];
    expect(forkSpread(js, 200)).toBe(0);
    expect(forkSpread(js, 290)).toBe(5);
    expect(forkSpread(js, 340)).toBe(0);
    const curve = { waves: [] as [number, number, number][] };
    expect(onRoad(curve, js, 290, -5)).toBe(true);
    expect(onRoad(curve, js, 290, 5)).toBe(true);
    expect(onRoad(curve, js, 290, 0)).toBe(false);
    expect(onRoad(curve, js, 200, 0)).toBe(true);
    expect(onRoad(curve, js, 200, ROAD_HALF + 0.5)).toBe(false);
  });

  it('every trip has its forks, a route through them, fuel, and clear forks', () => {
    for (let t = 0; t < TRIPS.length; t++) {
      const trip = game.buildTrip(t, seededRng(t + 3));
      expect(trip.junctions).toHaveLength(TRIPS[t]!.junctions);
      expect(trip.route).toHaveLength(trip.junctions.length);
      expect(trip.obstacles.some((o) => o.kind === 'fuel')).toBe(true);
      for (const j of trip.junctions) expect(trip.obstacles.every((o) => o.d < j.d - 55 || o.d > j.d + 40)).toBe(true);
    }
  });
});

describe('driving', () => {
  it('the Driver steers, the Co-pilot drives the pedals; nobody else counts', () => {
    const { room, driver, copilot } = drive();
    game.setHeld(room, driver, { left: false, right: true, gas: true, brake: false });
    game.setHeld(room, copilot, { left: true, right: false, gas: false, brake: false });
    expect(game.controls(room)).toEqual({ left: false, right: true, gas: false, brake: false });
    tick(room, 30);
    expect(room.van.speed).toBe(0); // the driver's gas does nothing
    game.setHeld(room, copilot, { ...NONE, gas: true });
    tick(room, 60);
    expect(room.van.speed).toBeGreaterThan(5);
    expect(room.van.fuel).toBeLessThan(100);
  });

  it('cows, potholes and rocks hurt; fuel cans refuel', () => {
    const { room } = drive();
    const v = room.van;
    for (const kind of ['cow', 'pothole', 'rock', 'fuel'] as const) {
      const o = room.obstacles.find((x) => x.kind === kind) ?? { ...room.obstacles[0]!, kind, id: 999 };
      if (!room.obstacles.includes(o)) room.obstacles.push(o);
      o.hit = false;
      o.vx = 0;
      v.d = o.d;
      v.x = o.x;
      const hp = v.hp;
      v.fuel = 50;
      tick(room, 1);
      if (kind === 'fuel') expect(v.fuel).toBeGreaterThan(80);
      else expect(v.hp).toBeLessThan(hp);
    }
  });

  it('a wrong turn backs you up and stalls you', () => {
    const { room } = drive();
    const j = room.junctions[0]!;
    const c = roadCenter(room.curve, j.d);
    room.van.d = j.d - 0.1;
    room.van.speed = 10;
    room.van.x = j.correct === 'left' ? c + 5 : c - 5;
    tick(room, 2);
    expect(room.wrongTurns).toBe(1);
    expect(room.van.d).toBeLessThan(j.d - DRIVE.wrongTurnBackUp + 5);
    tick(room, 10);
    expect(room.van.speed).toBe(0);
  });

  it('breaking down and running out of gas end the trip', () => {
    const a = drive();
    a.room.van.hp = 0.1;
    a.room.van.x += 50;
    a.room.van.speed = 10;
    tick(a.room, 5);
    expect(a.room.results[0]!.outcome).toBe('broke-down');
    const b = drive();
    b.room.van.fuel = 0;
    tick(b.room, 2);
    expect(b.room.results[0]!.outcome).toBe('out-of-gas');
  });

  it('a careful crew can finish every trip, and seats swap each trip', () => {
    for (let seed = 1; seed <= 3; seed++) {
      const { room } = drive(seed);
      let lastDriver = '';
      for (let t = 0; t < TRIPS.length; t++) {
        expect(room.driverId).not.toBe(lastDriver);
        lastDriver = room.driverId!;
        const driver = room.driverId!;
        const copilot = driver === 'pa' ? 'pb' : 'pa';
        for (let i = 0; i < 30 * 400 && room.phase === 'DRIVE'; i++) {
          autopilot(room, driver, copilot);
          tick(room, 1);
        }
        expect(room.results[t], `seed ${seed} trip ${t}`).toMatchObject({ outcome: 'arrived', wrongTurns: 0 });
        game.readyForNext(room, 'pa', ctxAt(0, seed));
        game.readyForNext(room, 'pb', ctxAt(0, seed));
      }
      expect(room.phase).toBe('FINISH');
    }
  });

  it('only the co-pilot sees the route while driving', () => {
    const { room, driver, copilot } = drive();
    expect(toPublicState(room, driver, 0).route).toBeNull();
    expect(toPublicState(room, copilot, 0).route).toEqual(room.route);
    const json = JSON.stringify(toPublicState(room, driver, 0));
    expect(json).not.toContain('correct');
    expect(json).not.toContain('token-');
  });
});
