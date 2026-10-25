import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import {
  EVIDENCE_IDS,
  GHOSTS,
  GHOST_IDS,
  H,
  MAP,
  ROOMS,
  START,
  TIMING,
  W,
  doorsOf,
  idx,
  nextStep,
  possibleGhosts,
  roomAt,
  tileAt,
  visibleFrom,
  walkable,
  type ExplorerView,
  type NavigatorView,
  type Room,
} from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });

function hunt(force: Parameters<typeof game.beginGame>[3] = { ghost: 'spirit', ghostRoom: 'nursery' }) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.beginGame(room, 'pa', ctxAt(0), force);
  return { room, ex: 'pa', nav: 'pb' };
}

/** Run the simulation until time t. */
const simRng = seededRng(7);
function runTo(room: Room, t: number, rng = simRng) {
  while (room.phase === 'HUNT' && room.nextTickAt <= t) game.tick(room, { now: room.nextTickAt, rng });
}

/** Walk the explorer to (x, y) one step at a time, without the ghost moving. */
function walkTo(room: Room, x: number, y: number, t0 = 1000) {
  let t = t0;
  for (let i = 0; i < 200 && (room.me.pos[0] !== x || room.me.pos[1] !== y); i++) {
    const [nx, ny] = nextStep(room.me.pos[0], room.me.pos[1], x, y, (tx, ty) => tileAt(tx, ty) === 'E')!;
    const dir = nx > room.me.pos[0] ? 'right' : nx < room.me.pos[0] ? 'left' : ny > room.me.pos[1] ? 'down' : 'up';
    t += TIMING.moveMs;
    game.move(room, 'pa', dir, ctxAt(t));
  }
  return t;
}

describe('the house', () => {
  it('every room and the exit can be reached from the start', () => {
    for (const r of ROOMS) expect(nextStep(START[0], START[1], r.x + 1, r.y + 1) ?? 'here', r.id).not.toBeNull();
    expect(MAP).toHaveLength(W * H);
    expect(tileAt(START[0], START[1] + 1)).toBe('E');
    for (const r of ROOMS) if (r.id !== 'hallway') expect(doorsOf(r.id).length, r.id).toBeGreaterThan(0);
  });

  it('the flashlight sees ahead, not through walls or behind you', () => {
    const [x, y] = START;
    const up = new Set(visibleFrom(x, y, 'up'));
    expect(up.has(idx(x, y - 4))).toBe(true);
    expect(up.has(idx(x, y + 1))).toBe(true); // the glow right around you
    expect(up.has(idx(x, y - 9))).toBe(false); // past the wall into the hallway's far side
    const down = new Set(visibleFrom(x, y, 'down'));
    expect(down.has(idx(x, y - 4))).toBe(false);
  });

  it('every ghost has a unique set of 3 evidence; the journal narrows them down', () => {
    const keys = GHOST_IDS.map((g) => [...GHOSTS[g].evidence].sort().join());
    expect(new Set(keys).size).toBe(GHOST_IDS.length);
    const marks = Object.fromEntries(EVIDENCE_IDS.map((e) => [e, null])) as Room['journal']['marks'];
    expect(possibleGhosts(marks)).toHaveLength(8);
    marks.emf = 'yes';
    marks.spiritbox = 'yes';
    expect(possibleGhosts(marks).sort()).toEqual(['spirit', 'wraith']);
    marks.freezing = 'no';
    expect(possibleGhosts(marks)).toEqual(['spirit']);
  });
});

describe('the hunt', () => {
  it('only the Explorer moves; walls block; steps are rate-limited', () => {
    const { room, ex, nav } = hunt();
    expect(() => game.move(room, nav, 'up', ctxAt(1000))).toThrow(/Navigator/);
    game.move(room, ex, 'up', ctxAt(1000));
    expect(room.me.pos).toEqual([START[0], START[1] - 1]);
    game.move(room, ex, 'up', ctxAt(1050)); // too soon: ignored
    expect(room.me.pos).toEqual([START[0], START[1] - 1]);
    game.move(room, ex, 'right', ctxAt(1200));
    game.move(room, ex, 'right', ctxAt(1400));
    game.move(room, ex, 'right', ctxAt(1600));
    game.move(room, ex, 'right', ctxAt(1800));
    game.move(room, ex, 'right', ctxAt(2000));
    game.move(room, ex, 'right', ctxAt(2200));
    expect(room.me.pos[0]).toBe(28); // stopped by the wall
    expect(room.me.facing).toBe('right');
  });

  it('evidence: EMF 5, freezing, spirit box and writing in the ghost room', () => {
    const { room, ex } = hunt({ ghost: 'spirit', ghostRoom: 'kitchen' }); // emf, spiritbox, writing
    room.nextHuntCheckAt = Infinity;
    const t = walkTo(room, 3, 13);
    expect(roomAt(...room.me.pos)).toBe('kitchen');
    room.nextTickAt = t;
    const emf = new Set<number>();
    for (let i = 0; i < 40; i++) {
      runTo(room, room.nextTickAt + TIMING.tickMs * TIMING.readingEveryTicks - 1);
      emf.add(room.readings.emf);
    }
    expect(emf.has(5)).toBe(true);
    expect(room.readings.temp).toBeGreaterThan(0); // a Spirit doesn't freeze the room
    let answered = false;
    for (let i = 0; i < 30 && !answered; i++) answered = !!game.useTool(room, ex, 'spiritbox', { now: t + 10_000 + i * 3000, rng: seededRng(i) });
    expect(answered).toBe(true);
    game.useTool(room, ex, 'book', ctxAt(room.nextTickAt));
    runTo(room, room.nextTickAt + 21_000);
    expect(room.book!.written).toBe(true);
  });

  it('no false evidence outside the ghost room or for the wrong ghost', () => {
    const { room, ex } = hunt({ ghost: 'demon', ghostRoom: 'nursery' }); // prints, writing, freezing
    room.nextHuntCheckAt = Infinity;
    room.sanity = 100;
    game.useTool(room, ex, 'book', ctxAt(10)); // in the living room
    for (let i = 0; i < 20; i++) expect(game.useTool(room, ex, 'spiritbox', { now: 1000 + i * 3000, rng: seededRng(i) })).toBeUndefined();
    runTo(room, 40_000);
    expect(room.book!.written).toBe(false);
    expect(room.prints.length).toBeGreaterThan(0);
    expect(room.roomTemps.nursery).toBeLessThan(0);
  });

  it('hunts start when sanity is low; hiding in a closet saves you; being caught loses', () => {
    const { room, ex } = hunt({ ghost: 'demon', ghostRoom: 'living' });
    room.sanity = 10;
    room.nextHuntCheckAt = 0;
    let t = 0;
    for (; room.hunt !== 'hunt' && t < 120_000; t += TIMING.tickMs) game.tick(room, { now: (room.nextTickAt = t), rng: seededRng(t) });
    expect(room.hunt).toBe('hunt');
    expect(() => game.move(room, ex, 'down', ctxAt(t + 500))).toThrow(/won't open/);
    // Standing still in the open: caught.
    for (let i = 0; i < 100 && room.phase === 'HUNT'; i++) game.tick(room, { now: (room.nextTickAt = t += TIMING.tickMs), rng: seededRng(i) });
    expect(room.phase).toBe('RESULT');
    expect(room.results[0]!.outcome).toBe('caught');
  });

  it('a hidden Explorer is safe during a hunt', () => {
    const { room, ex } = hunt({ ghost: 'jinn', ghostRoom: 'living' });
    const t0 = walkTo(room, 28, 16); // the living room closet
    game.useTool(room, ex, 'hide', ctxAt(t0));
    room.ghostPos = [27, 16];
    room.hunt = 'hunt';
    room.huntUntil = t0 + TIMING.huntMs;
    room.nextTickAt = t0;
    runTo(room, t0 + TIMING.huntMs + 1000);
    expect(room.phase).toBe('HUNT');
    expect(room.hunt).toBe('calm');
  });

  it('leaving needs a guess; the right guess escapes, a wrong one loses', () => {
    for (const [guess, outcome] of [['spirit', 'escaped'], ['demon', 'wrong']] as const) {
      const { room, ex, nav } = hunt();
      expect(() => game.move(room, ex, 'down', ctxAt(1000))).toThrow(/journal/);
      game.updateJournal(room, nav, { guess, mark: { evidence: 'emf', value: 'yes' } });
      game.move(room, ex, 'down', ctxAt(1200));
      expect(room.results[0]!.outcome).toBe(outcome);
    }
  });

  it('the time limit ends the game; roles swap for the next one', () => {
    const { room, ex, nav } = hunt();
    game.tick(room, ctxAt(room.endsAt));
    expect(room.results[0]!.outcome).toBe('timeout');
    game.readyForNext(room, ex, ctxAt(room.endsAt + 1));
    game.readyForNext(room, nav, ctxAt(room.endsAt + 1));
    expect(room.explorerId).toBe(nav);
  });
});

describe('redaction', () => {
  it('the Explorer sees only lit tiles and no ghost; the Navigator sees the map but no ghost', () => {
    const { room, ex, nav } = hunt({ ghost: 'phantom', ghostRoom: 'study' });
    const e = toPublicState(room, ex, 0).view as ExplorerView;
    expect(e.role).toBe('explorer');
    expect(Object.keys(e.visible).length).toBeLessThan(80);
    expect(e.ghost).toBeNull();
    const n = toPublicState(room, nav, 0).view as NavigatorView;
    expect(n.role).toBe('navigator');
    expect(n.map).toBe(MAP);
    for (const v of [toPublicState(room, ex, 0), toPublicState(room, nav, 0)]) {
      const json = JSON.stringify(v);
      expect(json).not.toContain('phantom');
      expect(json).not.toContain('"study"');
      expect(json).not.toContain('token-');
      expect(json).not.toContain('ghostPos');
    }
  });

  it('cameras show orbs and motion to the Navigator only', () => {
    const { room, ex, nav } = hunt({ ghost: 'phantom', ghostRoom: 'living' }); // has orbs
    game.useTool(room, ex, 'camera', ctxAt(10));
    room.ghostPos = [20, 12];
    const n = toPublicState(room, nav, 0).view as NavigatorView;
    expect(n.cameras[0]).toMatchObject({ room: 'living', orbs: true, motion: true });
    expect(JSON.stringify((toPublicState(room, ex, 0).view as ExplorerView).cameras)).not.toContain('orbs');
    expect(JSON.stringify(toPublicState(room, ex, 0))).not.toContain('motion');
  });

  it('walls are walls', () => {
    expect(walkable(0, 0)).toBe(false);
    expect(walkable(START[0], START[1])).toBe(true);
  });
});
