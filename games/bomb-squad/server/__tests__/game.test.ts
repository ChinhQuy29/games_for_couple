import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import {
  MANUAL,
  buttonAction,
  formatTimer,
  releaseDigit,
  simonMap,
  spellable,
  symbolColumn,
  symbolOrder,
  wireToCut,
  type Module,
  type Room,
} from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });
const odd = { serial: 'XB3CD7', batteries: 1 };
const even = { serial: 'XZ9QQ4', batteries: 3 };
const vowel = { serial: 'EB3CD2', batteries: 2 };

function armed(difficulty: Room['difficulty'] = 'normal', seed = 1) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.setDifficulty(room, 'pa', difficulty);
  game.startGame(room, 'pa', ctxAt(0, seed));
  const defuser = room.defuserId!;
  const expert = defuser === 'pa' ? 'pb' : 'pa';
  return { room, defuser, expert, bomb: room.bomb! };
}

/** Swap in a hand-made module so a test controls exactly what's on the bomb. */
function withModule(room: Room, mod: Module, serial = 'XB3CD7', batteries = 1) {
  room.bomb!.modules = [mod];
  room.bomb!.serial = serial;
  room.bomb!.batteries = batteries;
}

describe('wire rules', () => {
  it('3 wires', () => {
    expect(wireToCut(['red', 'blue', 'red'], odd)).toBe(0); // no yellow
    expect(wireToCut(['yellow', 'red', 'black'], odd)).toBe(1); // last black
    expect(wireToCut(['yellow', 'red', 'blue'], odd)).toBe(2);
  });
  it('4 wires', () => {
    expect(wireToCut(['red', 'blue', 'red', 'white'], odd)).toBe(2); // 2 reds, odd → last red
    expect(wireToCut(['red', 'yellow', 'red', 'white'], even)).toBe(2); // no blue → third
    expect(wireToCut(['blue', 'white', 'red', 'yellow'], even)).toBe(0); // one white
    expect(wireToCut(['blue', 'yellow', 'red', 'black'], even)).toBe(1);
  });
  it('5 wires', () => {
    expect(wireToCut(['red', 'red', 'red', 'red', 'yellow'], even)).toBe(3); // last yellow, 3 batteries
    expect(wireToCut(['red', 'black', 'blue', 'black', 'white'], odd)).toBe(1); // two blacks → first black
    expect(wireToCut(['blue', 'blue', 'white', 'yellow', 'white'], odd)).toBe(1); // no red
    expect(wireToCut(['red', 'blue', 'white', 'yellow', 'white'], odd)).toBe(0);
  });
  it('6 wires', () => {
    expect(wireToCut(['red', 'blue', 'blue', 'red', 'black', 'yellow'], even)).toBe(2); // no white, even
    expect(wireToCut(['red', 'blue', 'white', 'red', 'black', 'yellow'], odd)).toBe(4); // one blue
    expect(wireToCut(['red', 'red', 'white', 'blue', 'blue', 'yellow'], odd)).toBe(5); // more red than yellow
    expect(wireToCut(['yellow', 'red', 'white', 'blue', 'blue', 'yellow'], odd)).toBe(3);
  });
});

describe('other solvers', () => {
  it('button', () => {
    expect(buttonAction('blue', 'ABORT', even)).toBe('hold');
    expect(buttonAction('red', 'DETONATE', vowel)).toBe('tap');
    expect(buttonAction('white', 'PRESS', vowel)).toBe('hold');
    expect(buttonAction('yellow', 'PRESS', even)).toBe('tap');
    expect(buttonAction('red', 'HOLD', odd)).toBe('tap');
    expect(buttonAction('blue', 'PRESS', odd)).toBe('hold');
    expect(releaseDigit('blue')).toBe('4');
    expect(formatTimer(64_000)).toBe('1:04');
  });
  it('simon uses the vowel table and current strikes', () => {
    expect(simonMap('red', 0, vowel)).toBe('green');
    expect(simonMap('red', 1, vowel)).toBe('yellow');
    expect(simonMap('red', 0, odd)).toBe('blue');
    expect(simonMap('yellow', 2, odd)).toBe('green');
  });
  it('symbols are pressed in column order', () => {
    const col = MANUAL.symbols.columns[0];
    const four = [col[5], col[1], col[3], col[0]];
    expect(symbolColumn(four)).toEqual([0]);
    expect(symbolOrder(four)).toEqual([col[0], col[1], col[3], col[5]]);
  });
  it('generators always make solvable, unambiguous modules', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = seededRng(seed);
      const sym = game.makeModule('symbols', rng);
      if (sym.kind === 'symbols') expect(symbolColumn(sym.symbols)).toHaveLength(1);
      const pw = game.makeModule('password', rng);
      if (pw.kind === 'password') expect(spellable(pw.columns)).toHaveLength(1);
      const serial = game.makeSerial(rng);
      expect(serial).toMatch(/^[A-Z0-9]{5}\d$/);
    }
  });
});

describe('defusing', () => {
  it('a correct cut solves, a wrong cut strikes, and only the Defuser can act', () => {
    const { room, defuser, expert } = armed('easy');
    withModule(room, { kind: 'wires', wires: ['red', 'blue', 'red'], cut: [], solved: false });
    expect(() => game.act(room, expert, { op: 'cut', module: 0, wire: 0 }, ctxAt(1000))).toThrow(
      expect.objectContaining({ code: 'NOT_YOUR_ROLE' }),
    );
    expect(game.act(room, defuser, { op: 'cut', module: 0, wire: 2 }, ctxAt(1000))).toBe('strike');
    expect(game.act(room, defuser, { op: 'cut', module: 0, wire: 0 }, ctxAt(2000))).toBe('solved');
    expect(room.phase).toBe('RESULT');
    expect(room.results[0]).toMatchObject({ outcome: 'defused', strikes: 1 });
  });

  it('three strikes explode the bomb', () => {
    const { room, defuser } = armed();
    withModule(room, { kind: 'wires', wires: ['red', 'blue', 'red', 'black', 'white', 'yellow'], cut: [], solved: false });
    game.act(room, defuser, { op: 'cut', module: 0, wire: 0 }, ctxAt(1));
    game.act(room, defuser, { op: 'cut', module: 0, wire: 1 }, ctxAt(2));
    game.act(room, defuser, { op: 'cut', module: 0, wire: 2 }, ctxAt(3));
    expect(room.phase).toBe('RESULT');
    expect(room.results[0]).toMatchObject({ outcome: 'exploded', cause: 'strikes' });
  });

  it('the button: tap vs hold, and releasing on the right digit', () => {
    const { room, defuser } = armed();
    // red HOLD → tap
    withModule(room, { kind: 'button', color: 'red', label: 'HOLD', holding: null, solved: false });
    game.act(room, defuser, { op: 'press', module: 0 }, ctxAt(1000));
    expect(game.act(room, defuser, { op: 'release', module: 0, shown: '' }, ctxAt(1200))).toBe('solved');

    const second = armed('normal', 2);
    withModule(second.room, { kind: 'button', color: 'blue', label: 'PRESS', holding: null, solved: false });
    game.act(second.room, second.defuser, { op: 'press', module: 0 }, ctxAt(1000));
    const strip = (second.room.bomb!.modules[0] as Extract<Module, { kind: 'button' }>).holding!.strip;
    const digit = releaseDigit(strip);
    // Find a moment when the timer shows that digit, and release then.
    let t = 3000;
    while (!formatTimer(second.room.bomb!.endsAt - t).includes(digit)) t += 1000;
    expect(game.act(second.room, second.defuser, { op: 'release', module: 0, shown: formatTimer(second.room.bomb!.endsAt - t) }, ctxAt(t))).toBe(
      'solved',
    );
  });

  it('symbols, simon and password modules', () => {
    const { room, defuser } = armed();
    const col = MANUAL.symbols.columns[0];
    const four = [col[5]!, col[1]!, col[3]!, col[0]!];
    withModule(room, { kind: 'symbols', symbols: four, pressed: [], solved: false });
    expect(game.act(room, defuser, { op: 'symbol', module: 0, symbol: col[1]! }, ctxAt(1))).toBe('strike');
    for (const s of symbolOrder(four).slice(0, 3)) expect(game.act(room, defuser, { op: 'symbol', module: 0, symbol: s }, ctxAt(2))).toBe('ok');
    expect(game.act(room, defuser, { op: 'symbol', module: 0, symbol: col[5]! }, ctxAt(3))).toBe('solved');

    const s2 = armed('normal', 3);
    withModule(s2.room, { kind: 'simon', flashes: ['red', 'blue'], stage: 1, input: [], solved: false }, 'XB3CD7');
    expect(game.act(s2.room, s2.defuser, { op: 'simon', module: 0, color: 'blue' }, ctxAt(1))).toBe('ok'); // red → blue (no vowel, 0 strikes)
    expect(game.act(s2.room, s2.defuser, { op: 'simon', module: 0, color: 'blue' }, ctxAt(2))).toBe('ok');
    expect(game.act(s2.room, s2.defuser, { op: 'simon', module: 0, color: 'yellow' }, ctxAt(3))).toBe('solved'); // blue → yellow

    const s3 = armed('normal', 4);
    const cols = ['axxxxx', 'bxxxxx', 'oxxxxx', 'uxxxxx', 'txxxxx'].map((c) => c.split(''));
    withModule(s3.room, { kind: 'password', columns: cols, positions: [1, 0, 0, 0, 0], solved: false });
    expect(game.act(s3.room, s3.defuser, { op: 'submit', module: 0 }, ctxAt(1))).toBe('strike');
    game.act(s3.room, s3.defuser, { op: 'spin', module: 0, column: 0, dir: -1 }, ctxAt(2));
    expect(game.act(s3.room, s3.defuser, { op: 'submit', module: 0 }, ctxAt(3))).toBe('solved'); // "about"
  });

  it('runs out of time, then swaps roles for the next bomb', () => {
    const { room, defuser, bomb } = armed('hard');
    expect(bomb.modules).toHaveLength(5);
    expect(game.wakeAt(room)).toBe(180_000);
    expect(game.tick(room, ctxAt(180_000))).toBe(true);
    expect(room.results[0]).toMatchObject({ outcome: 'exploded', cause: 'time' });
    game.readyForNext(room, 'pa', ctxAt(181_000));
    game.readyForNext(room, 'pb', ctxAt(181_000));
    expect(room.phase).toBe('ARMED');
    expect(room.defuserId).not.toBe(defuser);
  });
});

describe('view', () => {
  it('the Expert never sees the armed bomb; everyone sees strikes and progress', () => {
    const { room, defuser, expert } = armed();
    const forExpert = toPublicState(room, expert, 0);
    expect(forExpert.role).toBe('expert');
    expect(forExpert.bomb).toBeNull();
    expect(JSON.stringify(forExpert).includes(room.bomb!.serial)).toBe(false);
    expect(forExpert.modulesTotal).toBe(4);
    const forDefuser = toPublicState(room, defuser, 0);
    expect(forDefuser.bomb?.serial).toBe(room.bomb!.serial);
    expect(JSON.stringify(forDefuser).includes('token-')).toBe(false);
  });
});

describe('who goes first', () => {
  it('the lobby choice picks the first Defuser: the host, the guest, or random', () => {
    for (const [first, expected] of [['host', 'pa'], ['guest', 'pb']] as const) {
      const room = game.newRoom('ABCD', ctxAt(0));
      addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
      addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
      room.first = first;
      game.startGame(room, 'pa', ctxAt(0, 3));
      expect(room.defuserId).toBe(expected);
    }
  });
});
