import { POINTS, RANKS } from './constants';

/** Seconds after the start at which each clue appears (first clue straight away). */
export function clueTimes(clueCount: number, limitSec: number): number[] {
  return Array.from({ length: clueCount }, (_, i) => Math.round((i * limitSec) / clueCount));
}

/** How many clues were showing at `elapsedMs`. */
export function cluesShown(clueCount: number, limitSec: number, elapsedMs: number): number {
  return clueTimes(clueCount, limitSec).filter((t) => elapsedMs >= t * 1000).length || 1;
}

/** Points for one answer. Wrong or missing answers score 0. */
export function pointsFor(opts: {
  correct: boolean;
  type: 'mc' | 'tf' | 'clues';
  elapsedMs: number;
  limitSec: number;
  clueCount: number;
  finale: boolean;
}): number {
  if (!opts.correct) return 0;
  const limitMs = opts.limitSec * 1000;
  const elapsed = Math.min(Math.max(opts.elapsedMs, 0), limitMs);
  let pts: number;
  if (opts.type === 'clues') {
    const shown = cluesShown(opts.clueCount, opts.limitSec, elapsed);
    pts = POINTS.clue[Math.min(shown, POINTS.clue.length) - 1]!;
  } else {
    pts = POINTS.base + Math.round(POINTS.speed * (1 - elapsed / limitMs));
  }
  return opts.finale ? pts * POINTS.finaleMultiplier : pts;
}

export function rankFor(correct: number, total: number) {
  const share = total ? correct / total : 0;
  return [...RANKS].reverse().find((r) => share >= r.min) ?? RANKS[0];
}
