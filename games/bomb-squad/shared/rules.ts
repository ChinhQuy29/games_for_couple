// Solvers: the exact rules of manual.ts as code. Pure functions, unit-tested.

import { MANUAL, type ButtonColor, type ButtonLabel, type SimonColor, type WireColor } from './manual';

export interface BombInfo {
  serial: string;
  batteries: number;
}

const lastDigit = (serial: string) => Number([...serial].reverse().find((c) => /\d/.test(c)) ?? 0);
export const serialOdd = (b: BombInfo) => lastDigit(b.serial) % 2 === 1;
export const serialHasVowel = (b: BombInfo) => /[AEIOU]/.test(b.serial);

const count = <T>(arr: T[], v: T) => arr.filter((x) => x === v).length;

/** Index (0-based) of the wire to cut. */
export function wireToCut(wires: WireColor[], bomb: BombInfo): number {
  const n = wires.length;
  const last = n - 1;
  const lastOf = (c: WireColor) => wires.lastIndexOf(c);
  if (n === 3) {
    if (count(wires, 'yellow') === 0) return 0;
    if (wires[last] === 'black') return 1;
    return last;
  }
  if (n === 4) {
    if (count(wires, 'red') > 1 && serialOdd(bomb)) return lastOf('red');
    if (count(wires, 'blue') === 0) return 2;
    if (count(wires, 'white') === 1) return 0;
    return 1;
  }
  if (n === 5) {
    if (wires[last] === 'yellow' && bomb.batteries >= 2) return 3;
    if (count(wires, 'black') === 2) return wires.indexOf('black');
    if (count(wires, 'red') === 0) return 1;
    return 0;
  }
  // 6 wires
  if (count(wires, 'white') === 0 && !serialOdd(bomb)) return 2;
  if (count(wires, 'blue') === 1) return 4;
  if (count(wires, 'red') > count(wires, 'yellow')) return last;
  return 3;
}

export function buttonAction(color: ButtonColor, label: ButtonLabel, bomb: BombInfo): 'tap' | 'hold' {
  if (color === 'blue' && label === 'ABORT') return 'hold';
  if (bomb.batteries >= 2 && label === 'DETONATE') return 'tap';
  if (color === 'white' && serialHasVowel(bomb)) return 'hold';
  if (bomb.batteries >= 3 && color === 'yellow') return 'tap';
  if (color === 'red' && label === 'HOLD') return 'tap';
  return 'hold';
}

/** Digit that must appear on the timer when releasing a held button. */
export function releaseDigit(strip: ButtonColor): string {
  return MANUAL.button.strip.find(([c]) => c === strip)![1];
}

/** "M:SS" as shown on the bomb timer. */
export function formatTimer(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The single column containing all four symbols, or -1. */
export function symbolColumn(symbols: string[]): number[] {
  return MANUAL.symbols.columns.map((col, i) => (symbols.every((s) => (col as readonly string[]).includes(s)) ? i : -1)).filter((i) => i >= 0);
}

/** The order to press the four symbols in. */
export function symbolOrder(symbols: string[]): string[] {
  const cols = symbolColumn(symbols);
  const col = MANUAL.symbols.columns[cols[0]!] as readonly string[];
  return [...symbols].sort((a, b) => col.indexOf(a) - col.indexOf(b));
}

export function simonMap(flashed: SimonColor, strikes: number, bomb: BombInfo): SimonColor {
  const table = MANUAL.simon.table[serialHasVowel(bomb) ? 'vowel' : 'noVowel'];
  return table[Math.min(2, strikes)]![flashed];
}

/** Words from the list that can be spelled with these wheels. */
export function spellable(columns: string[][]): string[] {
  return MANUAL.password.words.filter((w) => [...w].every((ch, i) => columns[i]!.includes(ch)));
}
